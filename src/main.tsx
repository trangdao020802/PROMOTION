import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Dashboard from './supplied/dashboard.js';
function App(){const[error,setError]=useState('');useEffect(()=>{const show=(e:any)=>setError(e.detail);window.addEventListener('local-save-error',show);return()=>window.removeEventListener('local-save-error',show)},[]);return <><Dashboard/>{error&&<div className="local-file-error" role="alert">{error}<button aria-label="Đóng thông báo" onClick={()=>setError('')}>×</button></div>}</>}
createRoot(document.getElementById('root')!).render(<App/>);
