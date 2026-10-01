const map = L.map('map', {zoomControl:true}).setView([19.03,99.90], 13);
const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles &copy; Esri'});
let satelliteOn=false, marker=null;
const placeForm=document.getElementById('placeForm'), placeInput=document.getElementById('placeInput'), searchStatus=document.getElementById('searchStatus');
function setMarker(lat,lng,title='ตำแหน่งที่เลือก'){
  if(marker) marker.remove();
  marker=L.marker([lat,lng],{draggable:true}).addTo(map).bindPopup(`<b>${title}</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`).openPopup();
  marker.on('dragend',()=>{const p=marker.getLatLng();marker.bindPopup(`<b>ตำแหน่งที่เลือก</b><br>Lat: ${p.lat.toFixed(6)}<br>Lng: ${p.lng.toFixed(6)}`).openPopup();});
  map.setView([lat,lng],16);
}
function showStatus(html){searchStatus.innerHTML=html;searchStatus.classList.remove('hidden');}
map.on('click',e=>setMarker(e.latlng.lat,e.latlng.lng));
placeForm.addEventListener('submit',async e=>{
  e.preventDefault(); const q=placeInput.value.trim(); if(!q)return;
  showStatus('กำลังค้นหาตำแหน่ง…');
  try{
    const url='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=th&q='+encodeURIComponent(q);
    const res=await fetch(url,{headers:{'Accept':'application/json'}}); const data=await res.json();
    if(!data.length){showStatus('ไม่พบสถานที่นี้ ลองใช้ชื่อสถานที่/จังหวัดให้ละเอียดขึ้น');return;}
    const x=data[0]; setMarker(+x.lat,+x.lon,x.display_name.split(',').slice(0,2).join(', '));
    showStatus(`<b>พบตำแหน่ง</b><br>${x.display_name}<br><small>Lat ${(+x.lat).toFixed(6)} · Lng ${(+x.lon).toFixed(6)}</small>`);
  }catch(err){showStatus('ค้นหาไม่สำเร็จในขณะนี้ กรุณาลองใหม่อีกครั้ง');}
});
document.getElementById('coordBtn').addEventListener('click',()=>{const lat=parseFloat(document.getElementById('latInput').value),lng=parseFloat(document.getElementById('lngInput').value);if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<-90||lat>90||lng<-180||lng>180){alert('กรุณาใส่ Latitude/Longitude ให้ถูกต้อง');return}setMarker(lat,lng);});
document.getElementById('exampleBtn').addEventListener('click',()=>{document.getElementById('latInput').value='19.0300';document.getElementById('lngInput').value='99.9000';document.getElementById('coordBtn').click();});
document.getElementById('locateBtn').addEventListener('click',()=>{if(!navigator.geolocation){alert('เบราว์เซอร์นี้ไม่รองรับ GPS');return}navigator.geolocation.getCurrentPosition(p=>setMarker(p.coords.latitude,p.coords.longitude,'ตำแหน่งของฉัน'),()=>alert('ไม่สามารถเข้าถึงตำแหน่งได้ กรุณาอนุญาต Location ในเบราว์เซอร์'));});
document.getElementById('satelliteBtn').addEventListener('click',e=>{satelliteOn=!satelliteOn;if(satelliteOn){map.removeLayer(street);satellite.addTo(map);e.currentTarget.textContent='🗺 แผนที่ถนน'}else{map.removeLayer(satellite);street.addTo(map);e.currentTarget.textContent='🛰 ภาพดาวเทียม'}});
document.querySelectorAll('[data-scroll]').forEach(b=>b.addEventListener('click',()=>document.querySelector(b.dataset.scroll).scrollIntoView({behavior:'smooth'})));
