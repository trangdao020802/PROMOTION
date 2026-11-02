// Applied only to projected Hub rows; internal allocations are not new cash.
export const internalHubPayment=p=>p?.typeId==='10'||/transfer|moving|deposit to contract|^other$/i.test((String(p?.method??'')+' '+String(p?.type??'')).trim());
