import {renewalWeekGift} from './promotions.mjs';
export const renewalWeekOffer=value=>renewalWeekGift(value)??0;
const number=value=>typeof value==='number'&&Number.isFinite(value);

// Preserve fractional award hours. Round the combined course once, exactly as
// the agreed Audit does; rounding each month separately inflates the total.
export function courseHourTotals(pricing,components,factor,pending=[],bonusWeeks=0){
 if(bonusWeeks!==0)components=[...components,{kind:'renewal-week',weeks:bonusWeeks}];
 const weeklyHours=pricing?.hours,baseMonths=pricing?.months,baseWeeks=pricing?.weeks,weekly=pricing?.unit==='weeks';
 const hasFactor=number(factor)&&factor>0;
 const valid=number(weeklyHours)&&weeklyHours>0&&(weekly?number(baseWeeks)&&baseWeeks>0:number(baseMonths)&&baseMonths>0&&hasFactor);
 const amountsValid=components.every(item=>(item.months===undefined||number(item.months)&&item.months>=0)&&(item.weeks===undefined||number(item.weeks)&&item.weeks>=0));
 const months=components.reduce((total,item)=>total+(item.months??0),0),weeks=components.reduce((total,item)=>total+(item.weeks??0),0),known=valid&&amountsValid&&!pending.length&&(!months||hasFactor);
 const baseHours=valid?(weekly?baseWeeks*weeklyHours:number(pricing?.totalHours)?pricing.totalHours:baseMonths*weeklyHours*factor):null;
 const extraHours=known?((months?months*weeklyHours*factor:0)+weeks*weeklyHours):null;
 return {unit:weekly?'weeks':'months',baseWeeks:weekly&&valid?baseWeeks:null,weeklyHours:valid?weeklyHours:null,baseMonths:!weekly&&valid?baseMonths:null,factor:valid&&hasFactor?factor:null,baseHours,
  bonusMonths:known?months:null,bonusWeeks:known?weeks:null,extraHours,totalHours:known?Math.round(baseHours+extraHours):null,
  components:components.map(item=>({...item,hours:valid&&amountsValid&&(!item.months||hasFactor)?((item.months??0)*weeklyHours*(item.months?factor:0)+(item.weeks??0)*weeklyHours):null})),pending:[...pending]};
}

export function courseHoursExplanation(hours){
 const terms=[];
 if(number(hours?.bonusMonths)&&hours.bonusMonths>0)terms.push(`${hours.bonusMonths} tháng × ${hours.weeklyHours} giờ/tuần × ${hours.factor===25/6?'25/6':hours.factor} tuần/tháng`);
 if(number(hours?.bonusWeeks)&&hours.bonusWeeks>0)terms.push(`${hours.bonusWeeks} tuần × ${hours.weeklyHours} giờ/tuần`);
 return (terms.length?'Giờ tặng = '+terms.join(' + '):'Không có giờ tặng áp dụng')+'; tổng giờ làm tròn sau khi cộng.';
}
