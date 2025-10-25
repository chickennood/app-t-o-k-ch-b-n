import React from 'react';
import { Platform } from '../../constants';

type IconProps = { className?: string };

const TikTokIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.43.03-4.83-.95-6.43-2.98-1.59-2.01-2.18-4.71-1.84-7.18.33-2.45 1.92-4.59 4.12-5.74 2.2-1.15 4.79-1.2 7.03-.13.33 2.13-.06 4.31-1.36 5.89-1.01 1.28-2.51 2.08-4.12 2.32-.9.13-1.82.09-2.7-.05-.33-.05-.65-.14-.97-.23-.04 1.56-.02 3.12.01 4.67.04 1.78.98 3.49 2.49 4.31 1.88 1.01 4.11.95 5.92-.12 1.35-.79 2.29-2.13 2.53-3.66.01-1.12.02-2.25.01-3.37v-4.63c-1.16.26-2.28.53-3.36.91-1.09.38-2.16.82-3.23 1.35-.11-1.89.06-3.78.02-5.66-.02-1.8-.42-3.58-1.15-5.22-1.1-2.48-3.28-4.28-5.7-4.94-1.29-.35-2.62-.46-3.95-.36-.23 1.7.16 3.48.9 5.02.63 1.27 1.64 2.32 2.88 3.01 1.23.69 2.65.98 4.05.84.6-.07 1.18-.21 1.74-.41-.12 1.31-.03 2.64-.03 3.96v.02z"/>
  </svg>
);

const ShortsIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.77 4.23L19.18 5.64L12 12.82L4.82 5.64L6.23 4.23L12 10L17.77 4.23M12 14.82L19.18 22L17.77 23.41L12 17.63L6.23 23.41L4.82 22L12 14.82Z"/>
  </svg>
);

const YouTubeIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.73,18.78 17.93,18.84C17.13,18.91 16.44,18.94 15.84,18.94L15,19C12.81,19 11.2,18.84 10.17,18.56C9.27,18.31 8.69,17.73 8.44,16.83C8.31,16.36 8.22,15.73 8.16,14.93C8.09,14.13 8.06,13.44 8.06,12.84L8,12C8,9.81 8.16,8.2 8.44,7.17C8.69,6.27 9.27,5.69 10.17,5.44C10.64,5.31 11.27,5.22 12.07,5.16C12.87,5.09 13.56,5.06 14.16,5.06L15,5C17.19,5 18.8,5.16 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z"/>
  </svg>
);

const ReelsIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.001 2.25C6.616 2.25 2.25 6.615 2.25 12c0 5.385 4.366 9.75 9.751 9.75c5.385 0 9.75-4.365 9.75-9.75c0-5.385-4.365-9.75-9.75-9.75Zm4.368 10.283L9.58 15.485a.75.75 0 0 1-1.144-.644V9.16a.75.75 0 0 1 1.144-.644l6.788 2.952a.75.75 0 0 1 0 1.289Z"/>
  </svg>
);

const ShopeeIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
);

export const PlatformIcons: Record<Platform, React.FC<IconProps>> = {
  [Platform.TikTok]: TikTokIcon,
  [Platform.Shorts]: ShortsIcon,
  [Platform.YouTube]: YouTubeIcon,
  [Platform.Reels]: ReelsIcon,
  [Platform.Shopee]: ShopeeIcon,
};