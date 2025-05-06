import { useState, useRef } from 'react';
import ReactCrop, { type Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Box, Button, Group, Modal } from '@mantine/core';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  opened: boolean;
  onClose: () => void;
  image: string;
  onCropComplete: (croppedImage: string) => void;
}

export function ImageCropper({ opened, onClose, image, onCropComplete }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }

  function generateDownload(canvas: HTMLCanvasElement, crop: PixelCrop) {
    if (!crop || !canvas) {
      return;
    }

    const croppedImage = canvas.toDataURL('image/jpeg');
    onCropComplete(croppedImage);
    onClose();
  }

  const handleCrop = () => {
    if (completedCrop && imgRef.current && previewCanvasRef.current) {
      const canvas = previewCanvasRef.current;
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      generateDownload(canvas, completedCrop);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Crop Image"
      size="lg"
      centered
    >
      <Box>
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={1}
          circularCrop={false}
          minWidth={100}
          minHeight={100}
        >
          <img
            ref={imgRef}
            alt="Crop me"
            src={image}
            onLoad={onImageLoad}
            style={{ maxWidth: '100%', maxHeight: '60vh' }}
          />
        </ReactCrop>

        <Group justify="flex-end" mt="md">
          <Button onClick={handleCrop} disabled={!completedCrop}>
            Crop Image
          </Button>
        </Group>

        <canvas
          ref={previewCanvasRef}
          style={{
            display: 'none',
          }}
        />
      </Box>
    </Modal>
  );
} 