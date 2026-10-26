// Cash documents, allocation movements and Export snapshots have different
// meanings. Only the first two contribute to the contract balance.
const sum = rows => rows.reduce((n, r) => n + r.amount, 0);
const sameMoney = (a, b) => Math.abs(a - b) <= 1;
const uniq = values => [...new Set(values.filter(Boolean))];
const isCT = value => /-CT-/i.test(value ?? '');
export const invoiceEligible = row => Boolean(String(row.payment??'').trim()&&String(row.vat??'').trim()&&row.paid===true&&!row.cancelled&&!row.warnings?.length);

// Check funding using original invoices, before crediting a transfer. Reports
// often omit transfer time, so same-day invoices are considered together. A
// later day's receipt cannot validate an earlier unsupported movement. All
// destinations from one origin/day need coverage; no arbitrary split priority.
export function invoiceFunding(receipts,movements,links=[]){
 const balances=new Map(),roots=new Map(),funded=new Map();
 const mapped=new Map();
 for(const origin of uniq(links.map(l=>l.origin))){
  const targets=uniq(links.filter(l=>l.origin===origin).map(l=>l.ct));
  if(!isCT(origin)&&targets.length===1&&links.some(l=>l.origin===origin&&l.cashLink)&&!movements.some(t=>t.from===origin||t.to===origin))mapped.set(origin,targets[0]);
 }
 const add=(origin,amount,ids)=>{const balance=(balances.get(origin)??0)+amount;balances.set(origin,balance);roots.set(origin,balance>1?new Set([...(roots.get(origin)??[]),...ids]):new Set());};
 const days=[...new Set([...receipts.map(r=>Math.floor(r.date)),...movements.map(t=>Math.floor(t.date))])].sort((a,b)=>a-b);
 for(const day of days){
  for(const r of receipts.filter(r=>Math.floor(r.date)===day&&invoiceEligible(r)))add(mapped.get(r.contract)??r.contract,r.amount,r.amount>0?[r.id]:[]);
  const groups=new Map();
  for(const t of movements.filter(t=>Math.floor(t.date)===day)){const group=groups.get(t.from)??[];group.push(t);groups.set(t.from,group);}
  let changed=true;
  while(changed){changed=false;
   for(const [origin,list]of groups){
    const need=list.reduce((n,t)=>n+t.out,0),available=balances.get(origin)??0,ids=[...(roots.get(origin)??[])];
    if(!ids.length||available<need-1||list.some(t=>!Number.isFinite(t.out)||!Number.isFinite(t.amount)||t.out<0||t.amount<0||t.amount>t.out+1))continue;
    balances.set(origin,available-need);
    if(available-need<=1)roots.set(origin,new Set());
    for(const t of list){funded.set(t.id,ids);add(t.to,t.amount,ids);}
    groups.delete(origin);changed=true;
   }
  }
  // A reported but unsupported outgoing movement cannot leave its money
  // available for a later credit. Retain the debit in the funding budget,
  // without turning its unproved destination into confirmed cash.
  for(const [origin,list]of groups){
   const out=list.reduce((n,t)=>n+t.out,0),balance=(balances.get(origin)??0)-out;
   balances.set(origin,Number.isFinite(balance)&&list.every(t=>t.out>=0)?balance:0);
   if(!(balances.get(origin)>1))roots.set(origin,new Set());
  }
 }
 return funded;
}

export function unionReceipts(sources) {
  const documents = new Map();
  let copies = 0;
  for (const source of sources) for (const row of source.rows) {
    const id = `${row.payment}|${String(row.vat ?? '').replace(/^0+(?=\d)/, '')}`;
    const previous = documents.get(id);
    if (!previous) { documents.set(id, {...row, id, refs:[row.ref], warnings:[]}); continue; }
    copies++;
    previous.refs.push(row.ref);
    if (previous.contract !== row.contract || previous.student !== row.student ||
        !sameMoney(previous.amount, row.amount) || Math.floor(previous.date) !== Math.floor(row.date) || previous.cancelled !== row.cancelled || previous.paid !== row.paid) {
      previous.warnings.push(`Chứng từ ${row.payment} / ${row.vat} khác nhau giữa các nguồn`);
    }
    // A day-only copy must not erase the precise timestamp of the receipt.
    if (Number.isInteger(previous.date) && !Number.isInteger(row.date)) previous.date = row.date;
  }
  const rows = [...documents.values()];
  const paymentIds = new Map();
  for (const row of rows) { const group = paymentIds.get(row.payment) ?? []; group.push(row); paymentIds.set(row.payment, group); }
  for (const group of paymentIds.values()) if (group.length > 1) for (const row of group)
    row.warnings.push(`Payment code ${row.payment} có nhiều VAT; cần xác minh điều chỉnh hóa đơn`);
  return {rows, copies};
}

export function unionTransfers(sources) {
  const groups = new Map();
  let sourceRows = 0;
  for (const source of sources) {
    const counts = new Map();
    for (const row of source.rows) {
      sourceRows++;
      const signature = JSON.stringify([row.type, Math.round(row.date * 86400), row.fromStudent, row.from, row.toStudent, row.to,
        row.out, row.amount, row.fromHours ?? 0, row.toHours ?? 0, row.description ?? '']);
      const index = counts.get(signature) ?? 0; counts.set(signature, index + 1);
      const group = groups.get(signature) ?? [];
      if (group[index]) group[index].refs.push(row.ref);
      else group[index] = {...row, id:`transfer:${groups.size}:${index}`, refs:[row.ref],paymentCodes:[]};
      // Optional observed metadata does not change financial identity or funding.
      // Copies with different codes retain the conflict for display, not a guess.
      if(typeof row.payment==='string'&&/-PAY-/i.test(row.payment)&&!group[index].paymentCodes.includes(row.payment))group[index].paymentCodes.push(row.payment);
      groups.set(signature, group);
    }
  }
  // Max multiplicity across extracts, rather than a Set: two identical-looking
  // movements in the same report remain two movements.
  const rows = [...groups.values()].flat();
  return {rows, copies:sourceRows - rows.length};
}

export function buildAccounts(input,{contractSummaries=false}={}) {
  const cash = unionReceipts(input.cashSources), transfers = unionTransfers(input.transferSources);
  const cutoff = input.cutoff;
  const receipts = cash.rows.filter(r => r.date < cutoff + 1 && !r.cancelled);
  const movements = transfers.rows.filter(r => r.date < cutoff + 1);
  const funded=invoiceFunding(receipts,movements,input.links);
  const paid = new Map(input.paid.map(r => [r.ct, r]));
  const snapshotMap = new Map(input.snapshots.map(r => [r.ct, r]));
  const byContract = new Map(), from = new Map(), to = new Map(), links = new Map(), events = new Map(), warnings = new Map();
  const add = (map, key, value) => { if (!key) return; const values = map.get(key) ?? []; values.push(value); map.set(key, values); };
  for (const r of receipts) add(byContract, r.contract, r);
  for (const r of movements) { add(from, r.from, r); add(to, r.to, r); }
  for (const r of input.links) add(links, r.origin, r);
  for (const t of movements) if (isCT(t.to)) add(links, t.from, {ct:t.to, ref:t.refs[0], cashLink:false});
  const warn = (ct, message) => add(warnings, ct, message);
  const event = (ct, value) => { if (isCT(ct)) add(events, ct, value); };
  for (const r of receipts) if (isCT(r.contract)) {
    event(r.contract, {kind:r.amount < 0 ? 'Hoàn tiền' : 'Thu trực tiếp CT', amount:r.amount, date:r.date, payment:r.payment, vat:r.vat, refs:r.refs,invoiceBacked:invoiceEligible(r),invoiceIds:invoiceEligible(r)?[r.id]:[]});
    for (const message of r.warnings) warn(r.contract, message);
    if(!invoiceEligible(r))warn(r.contract,`Payment ${r.payment}: thiếu hóa đơn VAT hợp lệ / chưa xác nhận đã thanh toán; chưa gộp số thu vào CT`);
  }
  for (const t of movements) {
    const proof={invoiceBacked:funded.has(t.id),invoiceIds:funded.get(t.id)??[],...(t.paymentCodes.length?{transferPayments:t.paymentCodes}:{})};
    if (isCT(t.from)) event(t.from, {kind:'Chuyển ra CT', amount:-t.out, date:t.date, payment:t.id, from:t.from, to:t.to, refs:t.refs,...proof});
    if (isCT(t.to)) event(t.to, {kind:isCT(t.from) ? 'Chuyển từ CT khác' : 'Phân bổ cọc vào CT', amount:t.amount, date:t.date, payment:t.id, from:t.from, to:t.to, refs:t.refs,...proof});
    if(!proof.invoiceBacked)for(const ct of [t.from,t.to].filter(isCT))warn(ct,`Chuyển ${t.from} → ${t.to}: chưa đủ hóa đơn thu gốc đã thanh toán tại ngày chuyển; chưa gộp vào tổng CT`);
  }
  const depositInfo = new Map();
  for (const origin of uniq([...byContract.keys(), ...links.keys()])) {
    if (isCT(origin)) continue;
    const documents = byContract.get(origin) ?? [], out = from.get(origin) ?? [], incoming = to.get(origin) ?? [];
    const candidates = uniq((links.get(origin) ?? []).map(x => x.ct));
    const received = sum(documents.filter(invoiceEligible)), allocated = out.reduce((s, t) => s + t.out, 0), incomingAmount = sum(incoming.filter(t=>funded.has(t.id)));
    const balance = received + incomingAmount - allocated;
    const problems = uniq(documents.flatMap(r => r.warnings));
    for(const r of documents.filter(r=>!invoiceEligible(r)))problems.push(`Payment ${r.payment}: thiếu hóa đơn VAT hợp lệ / chưa xác nhận đã thanh toán; chưa gộp số thu vào CT`);
    if (out.length && !documents.length && !incoming.length) problems.push(`Chưa có chứng từ thu gốc của ${origin}; không coi chuyển cọc là tiền thu mới`);
    if (balance < -1) problems.push(`Phân bổ từ ${origin} vượt số thu có chứng từ ${Math.round(-balance).toLocaleString('vi-VN')} đ`);
    const cashLink = (links.get(origin) ?? []).some(r => r.cashLink);
    const mappedCash = !out.length && !incoming.length && candidates.length === 1 && cashLink;
    if (mappedCash) for (const r of documents) event(candidates[0], {kind:'Thu cọc gắn CT', amount:r.amount, date:r.date, payment:r.payment, vat:r.vat, from:origin, to:candidates[0], refs:r.refs,invoiceBacked:invoiceEligible(r),invoiceIds:invoiceEligible(r)?[r.id]:[]});
    for (const ct of candidates) for (const message of problems) warn(ct, message);
    depositInfo.set(origin, {documents, out, incoming, candidates, received, allocated, balance, mappedCash, problems});
  }
  const summaries = {};
  for (const record of input.records) {
    const origin = record.contract;
    const dep = depositInfo.get(origin);
    const candidates = isCT(origin) ? [origin] : dep?.candidates ?? [];
    const valid = candidates.filter(ct => paid.has(ct));
    const ct = valid.length === 1 && candidates.length === 1 ? valid[0] : null;
    const problems = [];
    if (!candidates.length) problems.push('Cọc chưa có liên kết Contract tổng (CT) trong nguồn');
    else if (candidates.length > 1) problems.push('Một mã cọc phân bổ tới nhiều CT; không gán toàn bộ hóa đơn vào một CT');
    else if (!ct) problems.push('CT liên kết chưa có trong PAID_BY_CONTRACT cột A');
    const document = receipts.find(r => r.payment === record.id && r.student === record.student);
    if (!document) problems.push('Chưa tìm được chứng từ thu duy nhất cho Payment code');
    const list = ct ? events.get(ct) ?? [] : [];
    const contractProblems = [...(ct ? warnings.get(ct) ?? [] : [])];
    problems.push(...(ct ? warnings.get(ct) ?? [] : []));
    let contribution = null;
    if (ct && document && invoiceEligible(document)) {
      if (isCT(origin) || dep?.mappedCash) contribution = document.amount;
      else if (dep && dep.candidates.length === 1 && !dep.incoming.length && dep.out.every(t=>funded.has(t.id)) && sameMoney(dep.allocated, dep.received)) contribution = document.amount;
      else if (dep && dep.documents.length === 1 && !dep.incoming.length && dep.out.every(t=>funded.has(t.id))) contribution = dep.out.filter(t => t.to === ct).reduce((s,t) => s + t.amount, 0);
      else problems.push('Cọc phân bổ một phần: chưa đủ căn cứ tách từng hóa đơn thu');
    }
    if (document && contribution !== null && !sameMoney(document.amount, contribution)) problems.push('Hóa đơn chỉ được phân bổ một phần vào CT; cần đối chiếu số cọc còn lại');
    const net = sum(list.filter(e=>e.invoiceBacked));
    const sourcePaid = ct ? paid.get(ct) : null, snapshot = ct ? snapshotMap.get(ct) : null;
    if (sourcePaid?.student && sourcePaid.student !== record.student) {const message='CT nhận tiền thuộc học viên khác; cần đối chiếu hồ sơ chuyển nhượng trước khi so CALC của hóa đơn này';problems.push(message);contractProblems.push(message);}
    if (sourcePaid && typeof sourcePaid.ledger === 'number' && !sameMoney(net, sourcePaid.ledger))
      {const message='Tổng tính lại khác PAID_BY_CONTRACT; xem các chứng từ bổ sung/chuyển ra';problems.push(message);contractProblems.push(message);}
    const unlinked = receipts.filter(r => r.student === record.student && !isCT(r.contract) && !(links.get(r.contract)?.length));
    summaries[record.id] = {
      ct, candidates, origin, net, contribution, otherPayments:contribution === null ? null : net - contribution,
      warnings:uniq(problems), contractWarnings:uniq(contractProblems), events:list.sort((a,b) => a.date-b.date || a.payment.localeCompare(b.payment)),
      paid:sourcePaid, snapshot,
      unallocatedDeposit:dep ? (dep.mappedCash ? 0 : Math.max(0, dep.balance)) : 0,
      unlinkedDeposits:unlinked.map(r => ({payment:r.payment,contract:r.contract,amount:r.amount,date:r.date,refs:r.refs})),
      cashBefore:receipts.filter(r => r.student === record.student && r.payment !== record.id && r.date < Math.floor(record.date)).reduce((s,r) => s+r.amount,0),
      cutoff,
    };
  }
  // CT-level projections also cover destinations with no direct Payment row.
  // These are derived balances, never additional cash documents.
  const contracts={};
  if(contractSummaries)for(const [ct,sourcePaid] of paid){
    const list=[...(events.get(ct)??[])].sort((a,b)=>a.date-b.date||a.payment.localeCompare(b.payment)),net=sum(list.filter(e=>e.invoiceBacked)),problems=[...(warnings.get(ct)??[])];
    if(typeof sourcePaid.ledger==='number'&&!sameMoney(net,sourcePaid.ledger))problems.push('Tổng tính lại khác PAID_BY_CONTRACT; xem các chứng từ bổ sung/chuyển ra');
    contracts[ct]={ct,candidates:[ct],origin:ct,net,contribution:net,otherPayments:0,warnings:uniq(problems),contractWarnings:uniq(problems),events:list,paid:sourcePaid,snapshot:snapshotMap.get(ct),unallocatedDeposit:0,
      unlinkedDeposits:receipts.filter(r=>r.student===sourcePaid.student&&!isCT(r.contract)&&!links.get(r.contract)?.length).map(r=>({payment:r.payment,contract:r.contract,amount:r.amount,date:r.date,refs:r.refs})),cashBefore:0,cutoff};
  }
  return {records:summaries,...(contractSummaries?{contracts}:{}),statistics:{receipts:cash.rows.length, receiptCopies:cash.copies, transfers:transfers.rows.length, transferCopies:transfers.copies,
    resolved:Object.values(summaries).filter(r => r.ct).length, unresolved:Object.values(summaries).filter(r => !r.ct).length}};
}

export function financialResult(account, cells, tolerance = 1) {
  if (!account) return {status:'XÁC MINH - CHƯA CÓ DỮ LIỆU CT', blocking:true, target:null, calcTarget:null, overpaid:null};
  const calcTarget = ['M','N','O'].every(c => typeof cells[c] === 'number') && cells.M > 0 && Number(cells.AJ) > 0 && cells.AK
    ? cells.M - cells.N - cells.O : null;
  const target = typeof account.paid?.target === 'number' && account.paid.target > 0 ? account.paid.target
    : typeof account.snapshot?.target === 'number' && account.snapshot.target > 0 ? account.snapshot.target : null;
  if (account.warnings.length || !account.ct || account.otherPayments === null)
    return {status:'XÁC MINH - CHỨNG TỪ / LIÊN KẾT CT', blocking:true, target, calcTarget, overpaid:null};
  if (target === null) return {status:'XÁC MINH - CHƯA CÓ GIÁ TRỊ CT Ở NGUỒN', blocking:true, target, calcTarget, overpaid:null};
  const difference = account.net - target;
  if (difference > tolerance) return {status:`CHECK - THỪA TIỀN CT ${Math.round(difference).toLocaleString('vi-VN')} đ`, blocking:true, target, calcTarget, overpaid:difference};
  if (difference < -tolerance) return {status:`CÒN THIẾU CT ${Math.round(-difference).toLocaleString('vi-VN')} đ`, blocking:true, target, calcTarget, overpaid:0};
  if (calcTarget === null) return {status:'KHỚP CT - CẦN XÁC MINH CALC', blocking:true, target, calcTarget, overpaid:0};
  if (Math.abs(calcTarget-target)>tolerance) return {status:'CHECK - GIÁ TRỊ CT KHÁC CALC', blocking:true, target, calcTarget, overpaid:0};
  return {status:'KHỚP', blocking:false, target, calcTarget, overpaid:0};
}
