// Brand palette
export const colors = {
  softLavender: '#E6E6FA', // background/muted surfaces
  pastelPlum: '#A87CA0',   // accents, tags
  deepViolet: '#5E286D',   // primary brand (top priority)
  royalAubergine: '#5E286D', // alias to deep violet for consistency
  insta1: '#f58529',
  insta2: '#dd2a7b',
  insta3: '#8134af',
  insta4: '#515bd4',
}

// Semantic roles
export const roles = {
  primary: colors.deepViolet,
  secondary: colors.pastelPlum,
  accent: colors.pastelPlum,
  muted: colors.softLavender,
}

// Chart palette (ordered)
export const chartColors = [
  roles.primary,
  roles.secondary,
  roles.accent,
  '#8B5CF6', // violet-500
  '#A78BFA', // violet-400
  '#C4B5FD', // violet-300
]

// Button variants using brand colors
export const buttonVariants = {
  primary: {
    background: roles.primary,
    text: '#FFFFFF',
  },
  secondary: {
    background: roles.secondary,
    text: '#FFFFFF',
  },
  ghost: {
    background: 'transparent',
    text: roles.secondary,
    hover: colors.softLavender,
  },
  gradient: {
    background: `linear-gradient(90deg, ${colors.insta1}, ${colors.insta2}, ${colors.insta3}, ${colors.insta4})`,
    text: '#FFFFFF',
  },
}


