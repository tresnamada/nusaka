import fs from 'fs';

// To inspect a GLB, we can just look for mesh names if we parse the JSON chunk.
// But it's easier to use a simple script to read the glb json.
const buffer = fs.readFileSync('c:/Users/kreat/nusaka/public/model/pohon.glb');
const magic = buffer.readUInt32LE(0);
if (magic === 0x46546C67) {
    const version = buffer.readUInt32LE(4);
    const length = buffer.readUInt32LE(8);
    const chunkLength = buffer.readUInt32LE(12);
    const chunkType = buffer.readUInt32LE(16);
    if (chunkType === 0x4E4F534A) { // JSON
        const jsonString = buffer.toString('utf8', 20, 20 + chunkLength);
        const json = JSON.parse(jsonString);
        console.log(JSON.stringify(json.meshes, null, 2));
        console.log("Materials:", JSON.stringify(json.materials, null, 2));
    }
}
