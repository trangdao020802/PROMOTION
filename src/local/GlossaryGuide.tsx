import React from 'react';
import {GLOSSARY} from '../core/terms.mjs';

export default function GlossaryGuide(){
 return <details className="guide-glossary">
  <summary>Giải thích thuật ngữ trong hồ sơ</summary>
  <p>Đưa chuột vào từ có gạch chấm trong hồ sơ để xem giải thích. Bạn cũng có thể dùng phím Tab để đọc và nhấn Esc để đóng phần giải thích.</p>
  <div className="reference-scroll"><table className="glossary-table" aria-label="Giải thích thuật ngữ">
   <thead><tr><th>Thuật ngữ</th><th>Giải thích</th></tr></thead>
   <tbody>{GLOSSARY.map(term=><tr key={term.id}><th scope="row">{term.label}</th><td><strong>{term.meaning}</strong><p>{term.description}</p></td></tr>)}</tbody>
  </table></div>
 </details>;
}
