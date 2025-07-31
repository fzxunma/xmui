export default async function XmApiRequest(action, data = {}) {
  const payload = { action, data };
  const jsonStr = JSON.stringify(payload);
  // 浏览器环境下转 Base64：
  const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));
  
  const response = await fetch('http://localhost:3000/api/tree', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // 因为不是 JSON 了，改成纯文本
    body: base64Str
  });
  
  // 返回结果还是 JSON，直接解析
  const result = await response.json();
  if (!response.ok || result.code !== 0) {
    throw new Error(result.msg || 'API error');
  }
  return result;
}
