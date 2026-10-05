module.exports=async(req,res)=>{
if(req.method!=="POST")return res.status(405).json({error:"POST only"});
if(!process.env.GEMINI_API_KEY)return res.status(500).json({error:"Server API key is not configured"});
const{system,messages}=req.body||{};
if(!Array.isArray(messages)||!messages.length)return res.status(400).json({error:"No messages provided"});
const model=process.env.GEMINI_MODEL||"gemini-2.5-flash-lite";
try{
const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":process.env.GEMINI_API_KEY},body:JSON.stringify({systemInstruction:{parts:[{text:String(system||"").slice(0,4000)}]},contents:messages.slice(-12).map(m=>({role:m.role==="assistant"?"model":"user",parts:[{text:String(m.content||"").slice(0,6000)}]})),generationConfig:{maxOutputTokens:1024,temperature:.7}})});
const d=await r.json().catch(()=>({}));
if(!r.ok){
if(r.status===429)return res.status(429).json({error:"Nexora AI free quota is currently exhausted. Please try again after the quota resets."});
if(r.status===503)return res.status(503).json({error:"Gemini AI is temporarily busy. Please try again in a moment."});
return res.status(r.status).json({error:d?.error?.message||"Gemini API error"});
}
const parts=d?.candidates?.[0]?.content?.parts||[],text=parts.map(p=>p.text||"").join("").trim();
if(!text)return res.status(502).json({error:"Gemini returned an empty response. Please try again."});
return res.status(200).json({text});
}catch(e){return res.status(500).json({error:"Nexora server is temporarily unavailable. Please try again."})}
};
