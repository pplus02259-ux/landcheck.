const DATA = {
  "10001": {province:"เชียงราย",district:"เมืองเชียงราย",subdistrict:"สันทราย",area:"12 ไร่ 2 งาน 45.0 ตร.ว.",lat:19.9156,lng:99.8372},
  "10002": {province:"เชียงราย",district:"เมืองเชียงราย",subdistrict:"ริมกก",area:"8 ไร่ 1 งาน 20.0 ตร.ว.",lat:19.9234,lng:99.8512},
  "10003": {province:"เชียงราย",district:"เมืองเชียงราย",subdistrict:"ท่าสุด",area:"15 ไร่ 0 งาน 12.0 ตร.ว.",lat:19.8912,lng:99.8124}
};

const map = L.map("map", {zoomControl:false, attributionControl:true}).setView([19.9156,99.8372], 14);
const street = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom:19, attribution:"© OpenStreetMap contributors"
}).addTo(map);

const satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
  maxZoom:19, attribution:"Tiles © Esri"
});

L.control.zoom({position:"bottomright"}).addTo(map);

let currentMarker, currentPolygon;
let drawnPoints = [];
let drawingLayer = null;

function parcelShape(lat,lng){
  return [
    [lat+0.0050,lng-0.0052],[lat+0.0061,lng+0.0015],[lat+0.0032,lng+0.0060],
    [lat-0.0017,lng+0.0051],[lat-0.0055,lng+0.0007],[lat-0.0042,lng-0.0054],
    [lat+0.0003,lng-0.0070]
  ];
}

function showParcel(no){
  const d = DATA[no];
  if(!d){ toast("ไม่พบแปลงตัวอย่าง — ลอง 10001, 10002 หรือ 10003"); return; }

  document.querySelector("#parcelNo").textContent=no;
  document.querySelector("#infoProvince").textContent=d.province;
  document.querySelector("#infoDistrict").textContent=d.district;
  document.querySelector("#infoSubdistrict").textContent=d.subdistrict;
  document.querySelector("#infoArea").textContent=d.area;
  document.querySelector("#infoCoords").textContent=`${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}`;
  document.querySelector("#coordsBadge").textContent=`${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}`;
  document.querySelector("#mapStatus").textContent=`● พบแปลงเลขโฉนด ${no}`;

  if(currentMarker) map.removeLayer(currentMarker);
  if(currentPolygon) map.removeLayer(currentPolygon);

  currentPolygon = L.polygon(parcelShape(d.lat,d.lng), {
    color:"#087a46", weight:4, fillColor:"#21b865", fillOpacity:.38
  }).addTo(map);

  currentMarker = L.marker([d.lat,d.lng]).addTo(map)
    .bindPopup(`<strong>เลขโฉนด ${no}</strong><br>${d.area}<br><small>${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}</small>`)
    .openPopup();

  map.fitBounds(currentPolygon.getBounds(), {padding:[35,35]});
  toast(`แสดงแปลงเลขโฉนด ${no} แล้ว`);
}

function toast(msg){
  const el=document.querySelector("#toast");
  el.textContent=msg; el.classList.add("show");
  clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove("show"),2600);
}

document.querySelector("#searchBtn").addEventListener("click",()=>{
  showParcel(document.querySelector("#parcelInput").value.trim());
});
document.querySelector("#parcelInput").addEventListener("keydown",e=>{if(e.key==="Enter")showParcel(e.target.value.trim())});

document.querySelectorAll(".tab").forEach(tab=>{
  tab.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    tab.classList.add("active");
    ["parcelSearch","coordSearch","placeSearch"].forEach(id=>document.querySelector("#"+id).classList.add("hidden"));
    document.querySelector("#"+tab.dataset.mode+"Search").classList.remove("hidden");
  });
});

document.querySelector("#coordBtn").addEventListener("click",()=>{
  const lat=Number(document.querySelector("#latInput").value),lng=Number(document.querySelector("#lngInput").value);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)){toast("กรุณากรอกพิกัดให้ถูกต้อง");return}
  map.setView([lat,lng],17);
  L.popup().setLatLng([lat,lng]).setContent(`<strong>ตำแหน่งที่ค้นหา</strong><br>${lat.toFixed(5)}, ${lng.toFixed(5)}`).openOn(map);
  toast("เลื่อนไปยังพิกัดแล้ว");
});

document.querySelector("#placeBtn").addEventListener("click",async()=>{
  const q=document.querySelector("#placeInput").value.trim();
  if(!q){toast("กรุณาระบุสถานที่");return}
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q+", Thailand")}`,{headers:{Accept:"application/json"}});
    const a=await r.json();
    if(!a.length){toast("ไม่พบสถานที่ที่ค้นหา");return}
    map.setView([+a[0].lat,+a[0].lon],16);
    L.popup().setLatLng([+a[0].lat,+a[0].lon]).setContent(`<strong>${a[0].display_name.split(",")[0]}</strong>`).openOn(map);
    toast("พบสถานที่แล้ว");
  }catch(e){toast("ค้นหาสถานที่ไม่สำเร็จ")}
});

document.querySelectorAll(".map-type").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".map-type").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
    if(btn.dataset.layer==="satellite"){map.removeLayer(street);satellite.addTo(map)}else{map.removeLayer(satellite);street.addTo(map)}
  });
});

document.querySelector("#resetBtn").addEventListener("click",()=>showParcel("10001"));
document.querySelector("#locateBtn").addEventListener("click",()=>{
  map.locate({setView:true,maxZoom:16,enableHighAccuracy:true});
  map.once("locationfound",e=>{
    L.circleMarker(e.latlng,{radius:8,color:"#075f3d",fillColor:"#0a8b4b",fillOpacity:.8}).addTo(map).bindPopup("ตำแหน่งของคุณ").openPopup();
    toast("พบตำแหน่งของคุณแล้ว");
  });
  map.once("locationerror",()=>toast("ไม่สามารถเข้าถึงตำแหน่งได้ — กรุณาอนุญาต Location"));
});

document.querySelector("#measureBtn").addEventListener("click",()=>{
  toast("โหมดวัดระยะ: คลิก 2 จุดบนแผนที่");
  let pts=[];
  const handler=e=>{
    pts.push(e.latlng);
    L.circleMarker(e.latlng,{radius:5,color:"#075f3d",fillColor:"#fff",fillOpacity:1}).addTo(map);
    if(pts.length===2){
      const km=map.distance(pts[0],pts[1])/1000;
      L.polyline(pts,{color:"#075f3d",weight:4,dashArray:"7 6"}).addTo(map).bindTooltip(`${km.toFixed(2)} กม.`,{permanent:true}).openTooltip();
      map.off("click",handler); pts=[];
    }
  };
  map.on("click",handler);
});

document.querySelector("#drawBtn").addEventListener("click",()=>{
  toast("โหมดวาดพื้นที่: คลิกหลายจุด แล้วดับเบิลคลิกเพื่อจบ");
  let pts=[];
  const onClick=e=>{pts.push(e.latlng); if(drawingLayer)map.removeLayer(drawingLayer);drawingLayer=L.polygon(pts,{color:"#0a8b4b",fillColor:"#39c477",fillOpacity:.25}).addTo(map)};
  const onDbl=()=>{map.off("click",onClick);map.off("dblclick",onDbl);if(pts.length>2)toast("วาดพื้นที่เรียบร้อย");};
  map.on("click",onClick);map.on("dblclick",onDbl);
});

document.querySelector("#copyParcel").addEventListener("click",async()=>{
  await navigator.clipboard?.writeText(document.querySelector("#parcelNo").textContent);
  toast("คัดลอกเลขโฉนดแล้ว");
});
function openLandsMaps(){window.open("https://landsmaps.dol.go.th/","_blank","noopener,noreferrer")}
document.querySelector("#landsMapsBtn").addEventListener("click",openLandsMaps);
document.querySelector("#landsMapsBtn2").addEventListener("click",openLandsMaps);
document.querySelector("#loginBtn").addEventListener("click",()=>toast("ระบบเข้าสู่ระบบยังเป็นส่วนต้นแบบ"));

showParcel("10001");
