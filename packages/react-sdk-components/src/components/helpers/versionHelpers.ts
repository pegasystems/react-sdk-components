/**
 * versionHelpers.ts
 *
 * Container helper functions that can identify which version of
 * PCore/PConnect is being run
 */
import PCoreType from '@pega/pcore-pconnect-typedefs/types/pcore';

declare const PCore: typeof PCoreType;


export const sdkVersion = "8.7";

export function compareSdkPCoreVersions() {

  // const theConstellationVersion = PCore.getPCoreVersion();

  // eslint-disable-next-line no-console
  console.warn(`Using Constellation version ${PCore.getPCoreVersion()}. Ensure this is the same version as your Infinity server.`);

}
