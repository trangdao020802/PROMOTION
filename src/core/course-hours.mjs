const number=value=>typeof value==='number'&&Number.isFinite(value);

// Preserve fractional award hours. Round the combined course once, exactly as
// the agreed Audit does; rounding each month separately inflates the total.
export function courseHourTotals(pricing,components,factor,pending=[]){
 const weeklyHours=pricing?.hours,baseMonths=pricing?.months,baseWeeks=pricing?.weeks,weekly=pricing?.unit==='weeks';
 const hasFactor=number(factor)&&factor>0;
 const valid=number(weeklyHours)&&weeklyHours>0&&(weekly?number(baseWeeks)&&baseWeeks>0:number(baseMonths)&&baseMonths>0&&hasFactor);
 const months=components.reduce((total,item)=>total+item.months,0),known=valid&&!pending.length&&(!months||hasFactor);
 const baseHours=valid?(weekly?baseWeeks*weeklyHours:number(pricing?.totalHours)?pricing.totalHours:baseMonths*weeklyHours*factor):null;
 const extraHours=known?(months?months*weeklyHours*factor:0):null;
 return {unit:weekly?'weeks':'months',baseWeeks:weekly&&valid?baseWeeks:null,weeklyHours:valid?weeklyHours:null,baseMonths:!weekly&&valid?baseMonths:null,factor:valid&&hasFactor?factor:null,baseHours,
  bonusMonths:known?months:null,extraHours,totalHours:known?Math.round(baseHours+extraHours):null,
  components:components.map(item=>({...item,hours:valid?item.months*weeklyHours*factor:null})),pending:[...pending]};
}
