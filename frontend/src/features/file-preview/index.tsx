'use client';

import { useState, useEffect } from 'react';
import {
  FilePreviewComponent,
  InteractiveImageViewer,
  VideoViewer,
  AudioViewer,
  JSONViewer,
  CSVViewer,
  TextViewer,
  FilePreviewContainer,
} from '@/components/dist';

const sampleFiles = [
  {
    name: 'sample-image.jpg',
    url: 'https://picsum.photos/800/600',
    type: 'image',
  },
  {
    name: 'sample-document.pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    type: 'document',
  },
  {
    name: 'sample-video.mp4',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    type: 'video',
  },
  {
    name: 'sample-audio.mp3',
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    type: 'audio',
  },
  {
    name: 'sample-doc.ppt',
    url: 'https://s3.us-east-1.amazonaws.com/dev-insurance-suite/muzz-corp-67c966ebc0d07a8e61fa753f/task-attachments/file-example-ppt-250kb-1752141006535.ppt',
    type: 'ppt',
  },
  {
    name: 'file-sample_100kB.docx',
    url: 'https://s3.us-east-1.amazonaws.com/dev-insurance-suite/muzz-corp-67c966ebc0d07a8e61fa753f/task-attachments/file-sample-100kb-1752140979334.docx',
    type: 'excel',
  },
  {
    name: 'file_example_XLS_5000.xls',
    url: 'https://s3.us-east-1.amazonaws.com/dev-insurance-suite/muzz-corp-67c966ebc0d07a8e61fa753f/task-attachments/file-example-xls-5000-1752140964481.xls',
    type: 'word',
  },
];

const jsonContent = `{
  "name": "John Doe",
  "age": 30,
  "city": "New York",
  "skills": ["JavaScript", "React", "Node.js"],
  "address": {
    "street": "123 Main St",
    "zipCode": "10001"
  },
  "projects": [
    {
      "name": "E-commerce Platform",
      "status": "completed",
      "technologies": ["React", "Node.js", "MongoDB"],
      "startDate": "2023-01-15",
      "endDate": "2023-06-30",
      "budget": 50000
    },
    {
      "name": "Mobile App",
      "status": "in-progress",
      "technologies": ["React Native", "Firebase"],
      "startDate": "2023-07-01",
      "endDate": null,
      "budget": 75000
    },
    {
      "name": "Data Analytics Dashboard",
      "status": "planning",
      "technologies": ["Python", "Django", "PostgreSQL"],
      "startDate": "2024-01-01",
      "endDate": "2024-08-31",
      "budget": 100000
    }
  ],
  "preferences": {
    "theme": "dark",
    "notifications": true,
    "language": "en-US"
  }
}`;

const csvContent = `Name,Age,City,Occupation,Salary,Department,Start Date,Performance Rating,Projects Completed,Skills
John Doe,30,New York,Software Engineer,75000,Engineering,2020-01-15,4.5,12,"JavaScript,React,Node.js"
Jane Smith,25,Los Angeles,Designer,65000,Design,2021-03-22,4.8,8,"Figma,Photoshop,Illustrator"
Bob Johnson,35,Chicago,Manager,85000,Management,2019-07-10,4.2,15,"Leadership,Strategy,Communication"
Alice Brown,28,Seattle,Developer,70000,Engineering,2020-11-05,4.7,10,"Python,Django,PostgreSQL"
Charlie Wilson,32,Boston,Analyst,68000,Analytics,2021-01-20,4.3,6,"SQL,Tableau,Excel"
Diana Davis,29,Austin,Product Manager,78000,Product,2020-05-18,4.6,9,"Product Strategy,Agile,Scrum"
Eve Martinez,26,San Francisco,Frontend Developer,72000,Engineering,2021-08-12,4.9,7,"React,Vue.js,TypeScript"
Frank Garcia,33,Miami,Backend Developer,74000,Engineering,2019-12-03,4.4,11,"Java,Spring,MySQL"
Grace Lee,31,Portland,UX Designer,69000,Design,2020-09-14,4.5,5,"User Research,Wireframing,Prototyping"
Henry Kim,27,Denver,DevOps Engineer,76000,Engineering,2021-04-07,4.6,8,"Docker,Kubernetes,AWS"`;

const markdownContent = `# React File Preview Package

A comprehensive file preview component library for React applications.

## Features

### Image Viewer
- **Interactive Controls**: Zoom in/out, pan, reset view
- **Touch Support**: Pinch to zoom, drag to pan
- **Customizable**: Hide/show individual controls
- **External State**: Control zoom and pan from parent component

### Video & Audio Players
- **Custom Controls**: Show/hide player controls
- **Event Callbacks**: Handle play, pause, time updates
- **Multiple Formats**: Support for various media formats

### Document Viewers
- **PDF Support**: Embedded PDF viewing
- **Office Documents**: Word, Excel, PowerPoint support
- **Text Files**: Syntax highlighting for code files

## Installation

\`\`\`bash
npm install react-file-preview
# or
yarn add react-file-preview
\`\`\`

## Usage

### Basic Image Viewer

\`\`\`jsx
import { InteractiveImageViewer } from 'react-file-preview'

function App() {
  return (
    <InteractiveImageViewer
      src="https://example.com/image.jpg"
      alt="Sample image"
      controls={{
        showControls: true,
        allowZoom: true,
        allowPan: true
      }}
    />
  )
}
\`\`\`

### Controlled Image Viewer

\`\`\`jsx
import { useState } from 'react'
import { InteractiveImageViewer } from 'react-file-preview'

function ControlledViewer() {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  return (
    <InteractiveImageViewer
      src="image.jpg"
      zoom={zoom}
      onZoomChange={setZoom}
      pan={pan}
      onPanChange={setPan}
      methods={{
        onZoomIn: () => console.log('Zoomed in'),
        onZoomOut: () => console.log('Zoomed out')
      }}
    />
  )
}
\`\`\`

### Video Player

\`\`\`jsx
import { VideoViewer } from 'react-file-preview'

function VideoPlayer() {
  return (
    <VideoViewer
      src="video.mp4"
      controls={{
        showControls: true,
        autoPlay: false,
        loop: false
      }}
      methods={{
        onPlay: () => console.log('Video started'),
        onPause: () => console.log('Video paused')
      }}
    />
  )
}
\`\`\`

## API Reference

### InteractiveImageViewer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| \`src\` | string | - | Image URL |
| \`controls\` | object | \`{}\` | Control configuration |
| \`zoom\` | number | - | External zoom control |
| \`onZoomChange\` | function | - | Zoom change callback |

### Control Configuration

\`\`\`typescript
interface ImageControlsConfig {
  showControls?: boolean
  showZoomIn?: boolean
  showZoomOut?: boolean
  showReset?: boolean
  showFitToScreen?: boolean
  allowPan?: boolean
  allowZoom?: boolean
}
\`\`\`

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

> **Note**: This package is actively maintained and we welcome contributions!
`;

const javascriptCode = `// React File Preview - Interactive Image Viewer
import React, { useState, useCallback, useEffect } from 'react'

const InteractiveImageViewer = ({
  src,
  alt = "Image",
  controls = {},
  zoom: externalZoom,
  onZoomChange,
  methods = {}
}) => {
  const [internalZoom, setInternalZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  // Use external zoom if provided, otherwise internal
  const currentZoom = externalZoom !== undefined ? externalZoom : internalZoom

  const updateZoom = useCallback((newZoom) => {
    const clampedZoom = Math.max(0.1, Math.min(5, newZoom))
    
    if (externalZoom !== undefined) {
      onZoomChange?.(clampedZoom)
    } else {
      setInternalZoom(clampedZoom)
    }
    
    methods.onZoomChange?.(clampedZoom)
  }, [externalZoom, onZoomChange, methods])

  const handleZoomIn = () => {
    methods.onZoomIn?.()
    updateZoom(currentZoom + 0.2)
  }

  const handleZoomOut = () => {
    methods.onZoomOut?.()
    updateZoom(currentZoom - 0.2)
  }

  const handleReset = () => {
    methods.onReset?.()
    updateZoom(1)
    setOffset({ x: 0, y: 0 })
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Image Canvas */}
      <canvas
        className="w-full h-full cursor-grab"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      />
      
      {/* Controls */}
      {controls.showControls && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button onClick={handleZoomIn}>Zoom In</button>
          <button onClick={handleZoomOut}>Zoom Out</button>
          <button onClick={handleReset}>Reset</button>
        </div>
      )}
      
      {/* Zoom Indicator */}
      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded">
        {Math.round(currentZoom * 100)}%
      </div>
    </div>
  )
}

export default InteractiveImageViewer`;

const typescriptCode = `// TypeScript interfaces for React File Preview
interface ImageControlsConfig {
  showControls?: boolean
  showZoomIn?: boolean
  showZoomOut?: boolean
  showReset?: boolean
  showFitToScreen?: boolean
  allowPan?: boolean
  allowZoom?: boolean
}

interface ImageViewerMethods {
  onZoomIn?: () => void
  onZoomOut?: () => void
  onReset?: () => void
  onFitToScreen?: () => void
  onZoomChange?: (zoom: number) => void
  onPanChange?: (offset: { x: number; y: number }) => void
}

interface InteractiveImageViewerProps {
  src?: string
  blob?: Blob
  content?: string
  alt?: string
  className?: string
  controls?: ImageControlsConfig
  zoom?: number
  onZoomChange?: (zoom: number) => void
  pan?: { x: number; y: number }
  onPanChange?: (offset: { x: number; y: number }) => void
  methods?: ImageViewerMethods
  onError?: (error: string) => void
  onLoad?: () => void
}

// Generic content source interface
interface ContentSource {
  src?: string
  blob?: Blob
  content?: string
}

// Base viewer props
interface BaseViewerProps {
  className?: string
  onError?: (error: string) => void
  onLoad?: () => void
}

// Video viewer configuration
interface VideoControlsConfig {
  showControls?: boolean
  showPlayPause?: boolean
  showProgress?: boolean
  showVolume?: boolean
  showFullscreen?: boolean
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
}

interface VideoViewerProps extends BaseViewerProps, ContentSource {
  controls?: VideoControlsConfig
  methods?: {
    onPlay?: () => void
    onPause?: () => void
    onTimeUpdate?: (currentTime: number) => void
    onVolumeChange?: (volume: number) => void
    onFullscreen?: () => void
  }
}

export type {
  InteractiveImageViewerProps,
  ImageControlsConfig,
  ImageViewerMethods,
  VideoViewerProps,
  VideoControlsConfig,
  ContentSource,
  BaseViewerProps
}`;

const pythonCode = `# Python data processing example
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class DataProcessor:
    """A class for processing CSV data with filtering and analysis."""
    
    def __init__(self, csv_content: str):
        self.df = self._parse_csv(csv_content)
        self.original_shape = self.df.shape
    
    def _parse_csv(self, content: str) -> pd.DataFrame:
        """Parse CSV content into a pandas DataFrame."""
        from io import StringIO
        return pd.read_csv(StringIO(content))
    
    def filter_by_column(self, column: str, value: str) -> 'DataProcessor':
        """Filter data by column value."""
        if column in self.df.columns:
            mask = self.df[column].astype(str).str.contains(value, case=False, na=False)
            self.df = self.df[mask]
        return self
    
    def sort_by_column(self, column: str, ascending: bool = True) -> 'DataProcessor':
        """Sort data by specified column."""
        if column in self.df.columns:
            self.df = self.df.sort_values(by=column, ascending=ascending)
        return self
    
    def get_summary_stats(self) -> dict:
        """Get summary statistics for numeric columns."""
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        return {
            'total_rows': len(self.df),
            'numeric_columns': len(numeric_cols),
            'summary': self.df[numeric_cols].describe().to_dict() if len(numeric_cols) > 0 else {}
        }
    
    def search_all_columns(self, search_term: str) -> 'DataProcessor':
        """Search for term across all columns."""
        mask = self.df.astype(str).apply(
            lambda x: x.str.contains(search_term, case=False, na=False)
        ).any(axis=1)
        self.df = self.df[mask]
        return self
    
    def to_json(self) -> str:
        """Convert filtered data to JSON."""
        return self.df.to_json(orient='records', indent=2)

# Usage example
if __name__ == "__main__":
    csv_data = """Name,Age,City,Salary
    John,30,New York,75000
    Jane,25,Los Angeles,65000
    Bob,35,Chicago,85000"""
    
    processor = DataProcessor(csv_data)
    result = (processor
              .filter_by_column('City', 'New')
              .sort_by_column('Salary', ascending=False)
              .get_summary_stats())
    
    print(f"Processed {result['total_rows']} rows")
    print(f"Summary: {result['summary']}")`;

function App() {
  // FIXED: State for controlled image viewer - initialize with undefined to let component set initial values
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [imagePan, setImagePan] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isControlled, setIsControlled] = useState(false);

  // Initialize controlled state after component mounts
  useEffect(() => {
    // Delay initialization to let the image viewer set its initial state first
    const timer = setTimeout(() => {
      if (imageZoom === undefined) {
        setImageZoom(1);
      }
      if (imagePan === undefined) {
        setImagePan({ x: 0, y: 0 });
      }
      setIsControlled(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [imageZoom, imagePan]);

  // FIXED: Only pass controlled props when we're ready
  const controlledProps = isControlled
    ? {
        zoom: imageZoom,
        onZoomChange: setImageZoom,
        onPanChange: setImagePan,
      }
    : {};

  return (
    <div className='container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8'>
      <h1 className='mb-6 text-center text-2xl font-bold sm:mb-8 sm:text-3xl'>
        React File Preview Examples
      </h1>

      <div className='space-y-8 sm:space-y-12'>
        {/* FIXED: Enhanced Image Viewer Controls Demo */}
        <section>
          <h2 className='mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl'>
            Enhanced Image Viewer Controls (FIXED)
          </h2>

          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {/* Custom Controls Image Viewer */}
            <div className='rounded-lg border p-4'>
              <h3 className='mb-3 text-lg font-medium'>
                Custom Controls (Zoom Only)
              </h3>
              <div className='h-64'>
                <InteractiveImageViewer
                  src='https://picsum.photos/800/600'
                  alt='Custom controls image'
                  controls={{
                    showControls: true,
                    showZoomIn: true,
                    showZoomOut: true,
                    showReset: false,
                    showFitToScreen: false,
                    allowPan: true,
                    allowZoom: true,
                  }}
                />
              </div>
            </div>

            {/* No Controls Image Viewer */}
            <div className='rounded-lg border p-4'>
              <h3 className='mb-3 text-lg font-medium'>
                No Controls (View Only)
              </h3>
              <div className='h-64'>
                <InteractiveImageViewer
                  src='https://picsum.photos/600/400'
                  alt='No controls image'
                  controls={{
                    showControls: false,
                    allowPan: false,
                    allowZoom: false,
                  }}
                />
              </div>
            </div>

            {/* Pan Disabled Image Viewer */}
            <div className='rounded-lg border p-4'>
              <h3 className='mb-3 text-lg font-medium'>Zoom Only (No Pan)</h3>
              <div className='h-64'>
                <InteractiveImageViewer
                  src='https://picsum.photos/900/600'
                  alt='Zoom only image'
                  controls={{
                    showControls: true,
                    showZoomIn: true,
                    showZoomOut: true,
                    showReset: true,
                    showFitToScreen: true,
                    allowPan: false,
                    allowZoom: true,
                  }}
                />
              </div>
            </div>
            {/* FIXED: Controlled Image Viewer */}
            <div className='rounded-lg border p-4'>
              <h3 className='mb-3 text-lg font-medium'>
                Controlled Image Viewer (Fixed)
              </h3>
              <div className='mb-4 space-y-2'>
                <div className='flex items-center gap-4'>
                  <label className='text-sm font-medium'>
                    Zoom: {imageZoom ? Math.round(imageZoom * 100) : 100}%
                  </label>
                  <input
                    type='range'
                    min='0.1'
                    max='3'
                    step='0.1'
                    value={imageZoom || 1}
                    onChange={(e) =>
                      setImageZoom(Number.parseFloat(e.target.value))
                    }
                    className='flex-1'
                    disabled={!isControlled}
                  />
                </div>
                <div className='flex gap-2'>
                  <button
                    onClick={() => setImageZoom(1)}
                    disabled={!isControlled}
                    className='rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50'
                  >
                    Reset Zoom
                  </button>
                  <button
                    onClick={() => setImagePan({ x: 0, y: 0 })}
                    disabled={!isControlled}
                    className='rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50'
                  >
                    Reset Pan
                  </button>
                </div>
                {!isControlled && (
                  <div className='text-xs text-gray-500'>
                    Initializing controlled state...
                  </div>
                )}
              </div>
              <div className='h-64'>
                <InteractiveImageViewer
                  src='https://picsum.photos/1200/800'
                  alt='Controlled image'
                  {...controlledProps}
                  controls={{
                    showControls: true,
                    showZoomIn: true,
                    showZoomOut: true,
                    showReset: true,
                    showFitToScreen: true,
                    allowPan: true,
                    allowZoom: true,
                  }}
                  methods={{
                    onZoomIn: () => console.log('Zoom in clicked'),
                    onZoomOut: () => console.log('Zoom out clicked'),
                    onReset: () => console.log('Reset clicked'),
                    onFitToScreen: () => console.log('Fit to screen clicked'),
                    onZoomChange: (zoom) => console.log('Zoom changed:', zoom),
                    onPanChange: (pan) => console.log('Pan changed:', pan),
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced CSV Viewer with Filtering */}
        <section>
          <h2 className='mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl'>
            Enhanced CSV Viewer with Filtering & Search
          </h2>

          <div className='rounded-lg border p-4'>
            <h3 className='mb-3 text-lg font-medium'>
              Interactive CSV Data Table
            </h3>
            <p className='mb-4 text-sm text-gray-600'>
              Try searching, filtering by columns, and sorting by clicking
              column headers.
            </p>
            <FilePreviewContainer height='400px'>
              <CSVViewer content={csvContent} />
            </FilePreviewContainer>
          </div>
        </section>

        {/* Enhanced Text Viewers with Syntax Highlighting */}
        <section>
          <h2 className='mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl'>
            Enhanced Text Viewers
          </h2>

          <div className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
            {/* Markdown with Preview */}
            <div>
              <h3 className='mb-3 text-lg font-medium'>
                Markdown with Live Preview
              </h3>
              <TextViewer content={markdownContent} fileExtension='md' />
            </div>

            {/* JavaScript with Syntax Highlighting */}
            <div>
              <h3 className='mb-3 text-lg font-medium'>
                JavaScript with Syntax Highlighting
              </h3>
              <FilePreviewContainer height='400px'>
                <TextViewer content={javascriptCode} fileExtension='js' />
              </FilePreviewContainer>
            </div>

            {/* TypeScript with Syntax Highlighting */}
            <div>
              <h3 className='mb-3 text-lg font-medium'>
                TypeScript with Syntax Highlighting
              </h3>
              <TextViewer content={typescriptCode} fileExtension='ts' />
            </div>

            {/* Python with Syntax Highlighting */}
            <div>
              <h3 className='mb-3 text-lg font-medium'>
                Python with Syntax Highlighting
              </h3>
              <TextViewer content={pythonCode} fileExtension='py' />
            </div>
          </div>
        </section>

        {/* Enhanced JSON Viewer */}
        <section>
          <h2 className='mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl'>
            Enhanced JSON Viewer
          </h2>

          <div className='rounded-lg border p-4'>
            <h3 className='mb-3 text-lg font-medium'>
              Formatted JSON with Syntax Highlighting
            </h3>
            <JSONViewer content={jsonContent} />
          </div>
        </section>

        {/* Enhanced Video Viewer */}
        <section>
          <h2 className='mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl'>
            Enhanced Video Viewer
          </h2>

          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <div className='rounded-lg border p-4'>
              <h3 className='mb-3 text-lg font-medium'>Full Controls Video</h3>
              <div className='h-64'>
                <VideoViewer
                  src='https://www.w3schools.com/html/mov_bbb.mp4'
                  controls={{
                    showControls: true,
                    autoPlay: false,
                    loop: false,
                    muted: false,
                  }}
                  methods={{
                    onPlay: () => console.log('Video started playing'),
                    onPause: () => console.log('Video paused'),
                    onTimeUpdate: (time) => console.log('Time update:', time),
                    onVolumeChange: (volume) =>
                      console.log('Volume changed:', volume),
                  }}
                />
              </div>
            </div>

            <div className='rounded-lg border p-4'>
              <h3 className='mb-3 text-lg font-medium'>
                Auto-play Muted Video
              </h3>
              <div className='h-64'>
                <VideoViewer
                  src='https://www.w3schools.com/html/mov_bbb.mp4'
                  controls={{
                    showControls: true,
                    autoPlay: true,
                    loop: true,
                    muted: true,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Audio Viewer */}
        <section>
          <h2 className='mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl'>
            Enhanced Audio Viewer
          </h2>

          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <div className='rounded-lg border p-4'>
              <h3 className='mb-3 text-lg font-medium'>Full Controls Audio</h3>
              <div className='h-48'>
                <AudioViewer
                  src='https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
                  fileName='sample-audio.wav'
                  controls={{
                    showControls: true,
                    autoPlay: false,
                    loop: false,
                  }}
                  methods={{
                    onPlay: () => console.log('Audio started playing'),
                    onPause: () => console.log('Audio paused'),
                    onTimeUpdate: (time) => console.log('Audio time:', time),
                  }}
                />
              </div>
            </div>

            <div className='rounded-lg border p-4'>
              <h3 className='mb-3 text-lg font-medium'>Loop Audio</h3>
              <div className='h-48'>
                <AudioViewer
                  src='https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
                  fileName='loop-audio.wav'
                  controls={{
                    showControls: true,
                    loop: true,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* All File Types Demo */}
        <section>
          <h2 className='mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl'>
            All File Types Preview
          </h2>
          <div className='grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2'>
            {sampleFiles.map((file, index) => (
              <div
                key={index}
                className='rounded-lg border p-3 shadow-sm sm:p-4'
              >
                <h3 className='mb-3 text-base font-medium sm:text-lg'>
                  {file.name}
                </h3>
                <FilePreviewComponent
                  src={file.url}
                  fileName={file.name}
                  height='300px'
                  onError={(error: any) => console.error('Error:', error)}
                  onLoad={() => console.log('Loaded:', file.name)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Content Source Demo */}
        <section>
          <h2 className='mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl'>
            Content Source Examples
          </h2>

          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {/* Base64 Image */}
            <div className='rounded-lg border p-4'>
              <h3 className='mb-3 text-lg font-medium'>Base64 Image</h3>
              <div className='h-64'>
                <InteractiveImageViewer
                  content='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj4yMDB4MjAwPC90ZXh0Pgo8L3N2Zz4='
                  alt='Base64 SVG'
                />
              </div>
            </div>

            {/* Direct JSON Content */}
            <div className='rounded-lg border p-4'>
              <h3 className='mb-3 text-lg font-medium'>Direct JSON Content</h3>
              <JSONViewer content='{"message": "Hello from direct content!", "timestamp": "2024-01-01T00:00:00Z", "data": [1, 2, 3, 4, 5], "nested": {"key": "value", "array": ["a", "b", "c"]}}' />
            </div>
          </div>
        </section>

        {/* Method Callbacks Demo */}
        <section>
          <h2 className='mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl'>
            Method Callbacks Demo
          </h2>

          <div className='rounded-lg border p-4'>
            <h3 className='mb-3 text-lg font-medium'>
              Image with All Callbacks
            </h3>
            <div className='mb-4 rounded bg-gray-100 p-3 text-sm'>
              <p>
                Check the browser console to see callback logs when interacting
                with the image.
              </p>
            </div>
            <div className='h-64'>
              <InteractiveImageViewer
                src='https://picsum.photos/800/600'
                alt='Callback demo image'
                methods={{
                  onZoomIn: () => console.log('🔍 Zoom In button clicked'),
                  onZoomOut: () => console.log('🔍 Zoom Out button clicked'),
                  onReset: () => console.log('🔄 Reset button clicked'),
                  onFitToScreen: () =>
                    console.log('📐 Fit to Screen button clicked'),
                  onZoomChange: (zoom) =>
                    console.log(
                      '📏 Zoom changed to:',
                      Math.round(zoom * 100) + '%'
                    ),
                  onPanChange: (pan) => console.log('👆 Pan changed to:', pan),
                }}
                onLoad={() => console.log('✅ Image loaded successfully')}
                onError={(error) => console.error('❌ Image error:', error)}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
