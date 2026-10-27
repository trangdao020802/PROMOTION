import React from 'react';
import {discountOffers,discountPolicyMatch} from '../core/promotions.mjs';

export default function DiscountApplyInfo({value,date,components=[],checks=[]}:any){
 const offers=discountOffers(value);if(!offers.length)return null;
 return <span className="discount-offers" role="list" aria-label="Các ưu đãi trong Discount apply">
  {offers.map((label:string,index:number)=>{
   const match=discountPolicyMatch(label,date),part=components.find((p:any)=>p.label===label),kind=match.kind;
   const amount=typeof part?.amount==='number'?part.amount:null;
   const septemberStraight=match.ruleKey==='BBSEP26_STRAIGHT';
   const detail=septemberStraight?'Học phí Big Bang Sep sau giảm + tháng trả thẳng':kind==='months'||kind==='straight'?'Tặng tháng · không cộng vào tiền giảm':kind==='sibling-cash'?'Siblings giảm tiền':kind==='cash'?'Giảm theo gói':kind==='referral'?'Referral / Sibling':'Cần xác minh quy tắc';
   return <span className="discount-offer" role="listitem" key={label}><span className="discount-offer-label">{index+1}. {label}</span><span className="discount-offer-detail">{detail}{amount!==null&&(septemberStraight||!['months','straight'].includes(kind))?' · '+amount.toLocaleString('vi-VN')+' ₫':''}</span></span>;
  })}
  {checks.filter((message:string)=>/^CHECK - (?:SIBLINGS|SỐ TIỀN SIBLINGS|NHIỀU MỨC GIẢM SIBLINGS|NHIỀU ƯU ĐÃI|LAYER TRONG|GIỜ TRONG|GÓI TRONG|SPECIAL30)/.test(message)).map((message:string)=><span className="discount-offer-warning" key={message}>{message}</span>)}
 </span>;
}
