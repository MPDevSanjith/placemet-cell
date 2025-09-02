// Instagram Theme Colors
export const colors = {
  // Instagram gradient colors
  insta1: '#F58529', // Orange
  insta2: '#DD2A7B', // Pink
  insta3: '#8134AF', // Purple
  insta4: '#515BD4', // Blue
  
  // Text colors
  textDark: '#1c1c1c', // Dark gray for light backgrounds
  textLight: '#FFFFFF', // White for gradients
  
  // Background colors
  background: '#FFFFFF',
  backgroundMuted: '#F8F9FA',
  
  // Legacy colors (keeping for compatibility)
  softLavender: '#E6E6FA',
  pastelPlum: '#A87CA0',
  deepViolet: '#5E286D',
  royalAubergine: '#5E286D',
}

// Instagram gradient utilities
export const gradients = {
  primary: `linear-gradient(135deg, ${colors.insta1}, ${colors.insta2}, ${colors.insta3}, ${colors.insta4})`,
  horizontal: `linear-gradient(90deg, ${colors.insta1}, ${colors.insta2}, ${colors.insta3}, ${colors.insta4})`,
  vertical: `linear-gradient(180deg, ${colors.insta1}, ${colors.insta2}, ${colors.insta3}, ${colors.insta4})`,
  radial: `radial-gradient(circle, ${colors.insta1}, ${colors.insta2}, ${colors.insta3}, ${colors.insta4})`,
}

// Semantic roles
export const roles = {
  primary: colors.insta1,
  secondary: colors.insta2,
  accent: colors.insta3,
  muted: colors.backgroundMuted,
}

// Chart palette (ordered)
export const chartColors = [
  colors.insta1,
  colors.insta2,
  colors.insta3,
  colors.insta4,
  '#8B5CF6', // violet-500
  '#A78BFA', // violet-400
  '#C4B5FD', // violet-300
]

// Button variants using Instagram theme
export const buttonVariants = {
  primary: {
    background: gradients.primary,
    text: colors.textLight,
  },
  secondary: {
    background: colors.insta2,
    text: colors.textLight,
  },
  ghost: {
    background: 'transparent',
    text: colors.insta2,
    hover: colors.backgroundMuted,
  },
  gradient: {
    background: gradients.horizontal,
    text: colors.textLight,
  },
  outline: {
    background: 'transparent',
    text: colors.insta1,
    border: `2px solid ${colors.insta1}`,
    hover: colors.insta1,
    hoverText: colors.textLight,
  },
}

// Text variants
export const textVariants = {
  gradient: {
    background: gradients.primary,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heading: {
    color: colors.textDark,
    fontWeight: '700',
  },
  body: {
    color: colors.textDark,
    fontWeight: '400',
  },
  caption: {
    color: colors.textDark,
    opacity: 0.7,
    fontWeight: '400',
  },
}


