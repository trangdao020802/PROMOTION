const number=value=>typeof value==='number'&&Number.isFinite(value);

// Preserve fractional award hours. Round the combined course once, exactly as
// the agreed Audit does; rounding each month separately inflates the total.
// A named renewal scholarship awards two weeks, not two purchased months.
export function renewalWeekOffer(value){
 const name=String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
 return /^hoc bong tai phi\s*-\s*tang tuan\s*-\s*tang 2 tuan$/.test(name)?2:0;
}
export function courseHourTotals(pricing,components,factor,pending=[],bonusWeeks=0){
 const weeklyHours=pricing?.hours,baseMonths=pricing?.months,baseWeeks=pricing?.weeks,weekly=pricing?.unit==='weeks';
 const hasFactor=number(factor)&&factor>0;
 const valid=number(weeklyHours)&&weeklyHours>0&&(weekly?number(baseWeeks)&&baseWeeks>0:number(baseMonths)&&baseMonths>0&&hasFactor);
 const months=components.reduce((total,item)=>total+item.months,0),validWeeks=number(bonusWeeks)&&bonusWeeks>=0;
 const known=valid&&validWeeks&&!pending.length&&(!months||hasFactor);
 const baseHours=valid?(weekly?baseWeeks*weeklyHours:number(pricing?.totalHours)?pricing.totalHours:baseMonths*weeklyHours*factor):null;
 const extraHours=known?(months?months*weeklyHours*factor:0)+bonusWeeks*weeklyHours:null;
 return {unit:weekly?'weeks':'months',baseWeeks:weekly&&valid?baseWeeks:null,weeklyHours:valid?weeklyHours:null,baseMonths:!weekly&&valid?baseMonths:null,factor:valid&&hasFactor?factor:null,baseHours,
  bonusMonths:known?months:null,bonusWeeks:known?bonusWeeks:null,extraHours,totalHours:known?Math.round(baseHours+extraHours):null,
  components:[...components.map(item=>({...item,hours:valid?item.months*weeklyHours*factor:null})),...(bonusWeeks>0?[{kind:'renewal-week',weeks:bonusWeeks,hours:valid?bonusWeeks*weeklyHours:null}]:[])],pending:[...pending]};
}
