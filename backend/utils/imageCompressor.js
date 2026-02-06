import sharp from 'sharp';

/**
 * Compresses an image buffer
 * @param {Buffer} buffer - The image buffer
 * @param {number} width - Max width (default 800)
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
export const compressImage = async (buffer, width = 800) => {
    try {
        return await sharp(buffer)
            .resize(width, null, {
                withoutEnlargement: true,
                fit: 'inside'
            })
            .jpeg({ quality: 80, mozjpeg: true }) // Convert to JPEG with 80% quality
            .toBuffer();
    } catch (error) {
        console.error('Image compression error:', error);
        throw error;
    }
};

/**
 * Compresses a base64 image string
 * @param {string} base64String - The base64 string (with or without data prefix)
 * @param {number} width - Max width (default 800)
 * @returns {Promise<string>} - Compressed base64 string
 */
export const compressBase64 = async (base64String, width = 800) => {
    try {
        // Handle data URI scheme
        const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

        let buffer;
        const prefix = 'data:image/jpeg;base64,'; // We convert everything to JPEG

        if (matches && matches.length === 3) {
            buffer = Buffer.from(matches[2], 'base64');
        } else {
            buffer = Buffer.from(base64String, 'base64');
        }

        const compressedBuffer = await compressImage(buffer, width);
        return `${prefix}${compressedBuffer.toString('base64')}`;
    } catch (error) {
        console.error('Base64 compression error:', error);
        // Fallback: return original string if compression fails (to avoid breaking the flow)
        return base64String;
    }
};
