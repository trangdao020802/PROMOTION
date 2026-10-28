const number=value=>typeof value==='number'&&Number.isFinite(value);

// Preserve fractional award hours. Round the combined course once, exactly as
// the agreed Audit does; rounding each month separately inflates the total.
export function courseHourTotals(pricing,components,factor,pending=[]){
 const weeklyHours=pricing?.hours,baseMonths=pricing?.months;
 const valid=number(weeklyHours)&&weeklyHours>0&&number(baseMonths)&&baseMonths>0&&number(factor)&&factor>0;
 const months=components.reduce((total,item)=>total+item.months,0),known=valid&&!pending.length;
 const baseHours=valid?baseMonths*weeklyHours*factor:null;
 const extraHours=known?months*weeklyHours*factor:null;
 return {weeklyHours:valid?weeklyHours:null,baseMonths:valid?baseMonths:null,factor:valid?factor:null,baseHours,
  bonusMonths:known?months:null,extraHours,totalHours:known?Math.round((baseMonths+months)*weeklyHours*factor):null,
  components:components.map(item=>({...item,hours:valid?item.months*weeklyHours*factor:null})),pending:[...pending]};
}
