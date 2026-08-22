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
      x: left + width * 0.14,
      y: top + height * 0.075,
      size: width * 0.12,
    },
    title: {
      x: x + width * 0.04,
      y: top + height * 0.075,
      maxWidth: width * 0.62,
    },
    art: {
      x,
      y: top + height * 0.31,
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
      y: top + height * 0.945,
      width: width * 0.82,
      height: height * 0.075,
    },
  };
}
