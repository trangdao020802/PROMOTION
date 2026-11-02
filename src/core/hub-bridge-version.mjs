// One release number for the web's Hub tools and downloadable bridge.
export const HUB_BRIDGE_VERSION='1.6.21';

export function bridgeVersionAtLeast(value,minimum=HUB_BRIDGE_VERSION){
 const parse=v=>/^(0|[1-9]\d{0,4})\.(0|[1-9]\d{0,4})\.(0|[1-9]\d{0,4})$/.test(String(v))?String(v).split('.').map(Number):null;
 const current=parse(value),required=parse(minimum);
 if(!current||!required)return false;
 for(let i=0;i<3;i++)if(current[i]!==required[i])return current[i]>required[i];
 return true;
}
