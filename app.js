const PHAYAO = [19.1664, 99.9018];

const parcels = {
  "56001": {
    name:"แปลงจำลอง 56001", area:"12 ไร่", district:"อำเภอเมืองพะเยา",
    subdistrict:"ตำบลบ้านต๋อม", status:"พื้นที่เกษตรกรรม (จำลอง)",
    center:[19.1710,99.9040],
    coords:[[19.1730,99.9005],[19.1736,99.9072],[19.1690,99.9090],[19.1680,99.9020]]
  },
  "56002": {
    name:"แปลงจำลอง 56002", area:"8 ไร่", district:"อำเภอเมืองพะเยา",
    subdistrict:"ตำบลบ้านต๋อม", status:"พื้นที่เกษตรกรรม (จำลอง)",
    center:[19.1668,99.9120],
    coords:[[19.1690,99.9095],[19.1700,99.9150],[19.1650,99.9180],[19.1632,99.9110]]
  },
  "56003": {
    name:"แปลงจำลอง 56003", area:"15 ไร่", district:"อำเภอเมืองพะเยา",
    subdistrict:"ตำบลท่าวังทอง", status:"พื้นที่เกษตรกรรม (จำลอง)",
    center:[19.1580,99.9080],
    coords:[[19.1615,99.9030],[19.1630,99.9105],[19.1550,99.9140],[19.1530,99.9060]]
  },
  "56004": {
    name:"แปลงจำลอง 56004", area:"6 ไร่", district:"อำเภอเมืองพะเยา",
    subdistrict:"ตำบลแม่ใส", status:"พื้นที่เกษตรกรรม (จำลอง)",
    center:[19.1800,99.8950],
    coords:[[19.1820,99.8915],[19.1840,99.8980],[19.1785,99.9000],[19.1765,99.8935]]
  }
};

const map = L.map("map", { zoomControl:true }).setView(PHAYAO, 13);

const satellite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {maxZoom:19, attribution:"© Esri, Maxar, Earthstar Geographics"}
).addTo(map);

const streets = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {maxZoom:19, attribution:"© OpenStreetMap contributors"}
);

let selectedLayer = null;
const parcelLayers = {};

Object.entries(parcels).forEach(([id,p])=>{
  const layer = L.polygon(p.coords,{
    color:"#08783a", weight:3, fillColor:"#9dcc68", fillOpacity:.48
  }).addTo(map);

  layer.bindTooltip(id,{
    permanent:true, direction:"center", className:"parcel-label"
  });
  layer.bindPopup(`
    <div class="popup-title">${p.name}</div>
    <div style="margin-top:7px">พื้นที่: <b>${p.area}</b></div>
    <div>ตำบล: ${p.subdistrict}</div>
    <div>อำเภอ: ${p.district}</div>
    <div style="color:#08783a;margin-top:6px">ข้อมูลจำลองสำหรับ Prototype</div>
  `);
  layer.on("click",()=>showParcel(id, layer));
  parcelLayers[id]=layer;
});

function showParcel(id, layer=parcelLayers[id]){
  const p=parcels[id];
  if(selectedLayer) selectedLayer.setStyle({color:"#08783a",fillColor:"#9dcc68",fillOpacity:.48});
  selectedLayer=layer;
  layer.setStyle({color:"#ff8a00",weight:4,fillColor:"#ffd166",fillOpacity:.65});
  map.flyTo(p.center,15,{duration:.8});
  layer.openPopup();

  document.querySelector("#result").innerHTML=`
    <h3>${p.name}</h3>
    <div class="row"><span>เลขแปลง</span><span>${id}</span></div>
    <div class="row"><span>พื้นที่</span><span>${p.area}</span></div>
    <div class="row"><span>ตำบล</span><span>${p.subdistrict}</span></div>
    <div class="row"><span>อำเภอ</span><span>${p.district}</span></div>
    <div class="row"><span>สถานะ</span><span>${p.status}</span></div>
  `;
}

function searchParcel(){
  const id=document.querySelector("#parcelSearch").value.trim();
  if(parcels[id]) showParcel(id);
  else document.querySelector("#result").innerHTML=`<div class="empty-result">ไม่พบแปลง <b>${id||"ที่ค้นหา"}</b><br>ลอง 56001, 56002, 56003 หรือ 56004</div>`;
}
document.querySelector("#searchBtn").addEventListener("click",searchParcel);
document.querySelector("#parcelSearch").addEventListener("keydown",e=>{if(e.key==="Enter")searchParcel()});
document.querySelectorAll(".quick-list button").forEach(btn=>btn.addEventListener("click",()=>showParcel(btn.dataset.parcel)));

document.querySelector("#satelliteBtn").addEventListener("click",()=>{
  if(!map.hasLayer(satellite)) map.addLayer(satellite);
  if(map.hasLayer(streets)) map.removeLayer(streets);
  document.querySelector("#satelliteBtn").classList.add("active");
  document.querySelector("#streetBtn").classList.remove("active");
});
document.querySelector("#streetBtn").addEventListener("click",()=>{
  if(!map.hasLayer(streets)) map.addLayer(streets);
  if(map.hasLayer(satellite)) map.removeLayer(satellite);
  document.querySelector("#streetBtn").classList.add("active");
  document.querySelector("#satelliteBtn").classList.remove("active");
});

document.querySelector("#locateBtn").addEventListener("click",()=>{
  map.locate({setView:true,maxZoom:16});
});
map.on("locationfound",e=>{
  L.marker(e.latlng).addTo(map).bindPopup("ตำแหน่งของคุณ").openPopup();
});
map.on("locationerror",()=>alert("ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้ กรุณาอนุญาต Location ในเบราว์เซอร์"));

const drawnItems = new L.FeatureGroup().addTo(map);
const drawControl = new L.Control.Draw({
  position:"topright",
  edit:{featureGroup:drawnItems},
  draw:{polyline:true,polygon:true,rectangle:true,circle:true,marker:true,circlemarker:false}
});
map.addControl(drawControl);
map.on(L.Draw.Event.CREATED,e=>{
  drawnItems.addLayer(e.layer);
});

document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".nav-btn").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.panel).scrollIntoView({behavior:"smooth",block:"start"});
  });
});
