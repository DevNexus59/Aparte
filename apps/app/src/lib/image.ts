// Convertit un ArrayBuffer en data URI base64.
// Évite FileReader.readAsDataURL, peu fiable sur RN/Hermes avec un blob fetch.
export function arrayBufferToDataUri(buffer: ArrayBuffer, contentType: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${contentType};base64,${btoa(binary)}`;
}
