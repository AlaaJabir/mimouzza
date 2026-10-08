import React from 'react';
import { VitaliveLogo, VitaliveLogoProps, MIMOUZZA_BRAND_BG, VITALIVE_BRAND_COLOR, VITALIVE_DARK_BRAND } from './VitaliveLogo';

export { MIMOUZZA_BRAND_BG, VITALIVE_BRAND_COLOR, VITALIVE_DARK_BRAND };
export type MimouzzaLogoProps = VitaliveLogoProps;

/**
 * Vitalive brand logo (formerly Mimouzza).
 * Seamlessly rendered across landing pages, COD checkout forms, and Admin dashboard.
 */
export const MimouzzaLogo: React.FC<MimouzzaLogoProps> = (props) => {
  return <VitaliveLogo {...props} />;
};

export { VitaliveLogo };
