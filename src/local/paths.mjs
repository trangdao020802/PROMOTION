export const APP_BASE_PATH=typeof __APP_BASE_PATH__==='string'?__APP_BASE_PATH__:'/';
export const assetPath=name=>APP_BASE_PATH+String(name).replace(/^\//,'');
