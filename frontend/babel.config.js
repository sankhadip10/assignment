module.exports = {
  presets: [
    'next/babel',                         // Next.js preset
    '@babel/preset-typescript',           // Handle .ts/.tsx in Jest
    ['@babel/preset-react', { runtime: 'automatic' }], // Modern JSX transform
  ],
};
