# Heart4Edu System Monitor - Professional Frontend

Sebuah aplikasi web modern untuk monitoring sistem CPR real-time yang dibangun dengan React, TypeScript, dan Tailwind CSS.

## 🚀 Fitur Utama

- **React 18 + TypeScript**: Type-safe development dengan latest React features
- **Vite**: Fast build tool dan hot module replacement
- **Tailwind CSS**: Utility-first CSS framework untuk rapid UI development
- **Lucide React**: Modern icon library
- **Framer Motion**: Smooth animations dan transitions
- **Responsive Design**: Mobile-first approach dengan optimal UX di semua device
- **Professional Structure**: Modular component architecture
- **ESLint + TypeScript**: Code quality dan consistency

## 📁 Struktur Project

```
heart4edu/
├── public/                     # Static assets
├── src/
│   ├── components/            # React components
│   │   ├── common/           # Reusable components (Button, Card, etc.)
│   │   └── sections/         # Page sections (Header, Hero, etc.)
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions dan mock data
│   ├── styles/               # Global styles dan CSS
│   ├── App.tsx              # Main App component
│   └── main.tsx             # Entry point
├── package.json             # Dependencies dan scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

## 🛠️ Tech Stack

### Core
- **React 18**: Modern React dengan functional components dan hooks
- **TypeScript**: Type safety dan better developer experience
- **Vite**: Fast development server dan optimized builds

### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful, customizable icons
- **Framer Motion**: Production-ready motion library

### Development Tools
- **ESLint**: Code linting dan formatting
- **PostCSS**: CSS processing dengan Autoprefixer

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 atau lebih baru)
- npm, yarn, atau pnpm

### Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd heart4edu
   ```

2. **Install dependencies**
   ```bash
   npm install
   # atau
   yarn install
   # atau
   pnpm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # atau
   yarn dev
   # atau
   pnpm dev
   ```

4. **Buka browser**
   Aplikasi akan tersedia di `http://localhost:3000`

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start development server dengan hot reload

# Build
npm run build        # Build untuk production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors automatically
npm run type-check   # Check TypeScript types
```

## 🎨 Customization

### Warna & Theme
Edit `tailwind.config.js` untuk mengustomisasi color palette:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Custom primary colors
      },
      secondary: {
        // Custom secondary colors
      }
    }
  }
}
```

### Komponen
Semua komponen tersimpan di `src/components/`:
- `common/`: Komponen reusable (Button, Card, etc.)
- `sections/`: Komponen spesifik halaman (Header, Hero, etc.)

### Types
Type definitions tersimpan di `src/types/index.ts` untuk type safety.

## 🔧 Development Guidelines

### Component Structure
```typescript
import React from 'react';

interface ComponentProps {
  // Define props with TypeScript
}

export const Component: React.FC<ComponentProps> = ({ props }) => {
  return (
    <div className="tailwind-classes">
      {/* Component content */}
    </div>
  );
};
```

### Styling Conventions
- Gunakan Tailwind utilities
- Responsive design dengan breakpoints (sm:, md:, lg:, xl:)
- Consistent spacing dan color usage
- Dark theme sebagai default

### File Naming
- PascalCase untuk components: `StatusCard.tsx`
- camelCase untuk utilities: `dataUtils.ts`
- kebab-case untuk directories: `common/`, `sections/`

## � Responsive Design

Design menggunakan mobile-first approach:

```css
/* Mobile first */
.class { /* styles untuk mobile */ }

/* Tablet */
@media (min-width: 768px) { /* md: */ }

/* Desktop */
@media (min-width: 1024px) { /* lg: */ }

/* Large Desktop */
@media (min-width: 1280px) { /* xl: */ }
```

## 🚀 Deployment

### Build untuk Production
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

File build akan tersimpan di folder `dist/` dan siap untuk deployment ke:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

## 🤝 Contributing

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Project ini menggunakan MIT License. Lihat file `LICENSE` untuk detail.

## 🆘 Troubleshooting

### Common Issues

**Dependencies tidak terinstall:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors:**
```bash
npm run type-check
```

**Build errors:**
```bash
npm run lint:fix
npm run build
```

## 📞 Support

Jika mengalami masalah atau memiliki pertanyaan:
1. Check existing issues di repository
2. Buat issue baru dengan detail yang jelas
3. Include error messages dan steps to reproduce

---

**Dibuat dengan ❤️ untuk Heart4Edu System Monitor**

*Membantu menyelamatkan nyawa melalui teknologi modern*
