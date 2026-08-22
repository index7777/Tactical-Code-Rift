export interface CardContentLayout {
  title: { x: number; y: number; maxWidth: number };
  familyBadge: { x: number; y: number; size: number };
  art: { x: number; y: number; width: number; height: number };
  effect: { x: number; firstLineY: number; lineGap: number; maxWidth: number };
  footer: { x: number; y: number; width: number; height: number };
}

export function cardContentLayout(x: number, y: number, width: number, height: number): CardContentLayout {
  const left = x - width / 2;
  const top = y - height / 2;
  return {
    familyBadge: {
      x: left + width * 0.16,
      y: top + height * 0.495,
      size: width * 0.1,
    },
    title: {
      x: x + width * 0.06,
      y: top + height * 0.495,
      maxWidth: width * 0.56,
    },
    art: {
      x,
      y: top + height * 0.26,
      width: width * 0.78,
      height: height * 0.34,
    },
    effect: {
      x,
      firstLineY: top + height * 0.65,
      lineGap: height * 0.085,
      maxWidth: width * 0.72,
    },
    footer: {
      x,
      y: top + height * 0.89,
      width: width * 0.78,
      height: height * 0.065,
    },
  };
}
