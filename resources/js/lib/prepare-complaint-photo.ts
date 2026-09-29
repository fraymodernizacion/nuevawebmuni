const maximumDimension = 1600;
const jpegQuality = 0.78;

export async function prepareComplaintPhoto(file: File): Promise<File> {
    if (!file.type.startsWith('image/')) {
        return file;
    }

    const objectUrl = URL.createObjectURL(file);

    try {
        const image = new Image();
        image.src = objectUrl;
        await image.decode();

        const scale = Math.min(
            1,
            maximumDimension /
                Math.max(image.naturalWidth, image.naturalHeight),
        );
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);

        const context = canvas.getContext('2d');

        if (!context || canvas.width === 0 || canvas.height === 0) {
            return file;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const compressed = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', jpegQuality),
        );

        if (!compressed || compressed.size >= file.size) {
            return file;
        }

        const filename = file.name.replace(/\.[^.]+$/, '') || 'foto';

        return new File([compressed], `${filename}.jpg`, {
            type: 'image/jpeg',
            lastModified: file.lastModified,
        });
    } catch {
        return file;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}
