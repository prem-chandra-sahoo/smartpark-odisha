import coveredImg from "@/assets/facility-covered.jpg";
import openImg from "@/assets/facility-open.jpg";

/** Opens Google Maps navigation to the facility from the user's current location. */
export function directionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

/** Sample photos for demo listings (illustrative only). */
export function demoImagesFor(isCovered: boolean) {
  return isCovered ? [coveredImg, openImg] : [openImg, coveredImg];
}
