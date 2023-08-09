#### **Release SDK-R-C 8.23.11 (10 August 2023)**

* Many significant improvements to localization
* Added new AlertBanner component (in designSystemExtension) and its use in Assignment and ModalViewContainer
* Bug fixes in Decimal and Attachment components
* Fixed some cases where Dropdown items weren't properly loaded from datasource
* Infrastructure components (FlowContainer and ModalViewContainer) now use overridden component implementations when overrides are available.
* Bug fixes
* Full set of merged PRs can be found in the [react-sdk-components GitHub repo list of merged PRs](https://github.com/pegasystems/react-sdk-components/pulls?page=1&q=is%3Apr+is%3Amerged). This release includes all PRs since (and including) #117 and #165.

<br />

<hr />


#### **Release SDK-R-C 8.23.10 (24 April 2023)**

This is the initial release of the React SDK Components packages:
[**@pega/react-sdk-components**](https://www.npmjs.com/package/@pega/react-sdk-components)
and [**@pega/react-sdk-overrides**](https://www.npmjs.com/package/@pega/react-sdk-overrides).
This release contains all of the bridge and component code that was in the original
packaging of the React SDK (which is now available in the React SDK's release/8.8.10 branch).

These packages support use with **Pega Infinity&trade; 8.8.0+ and 8.23** and used in conjunction with the [**Pega Constellation React SDK**](https://community.pega.com/marketplace/components/react-sdk).

* [**react-sdk-components**](https://www.npmjs.com/package/@pega/react-sdk-components) <br />
This package contains the run-time (compiled) code for the Pega-provided **bridge**
to the [**ConstellationJS Engine**](https://www.npmjs.com/package/@pega/constellationjs) and
the **DX components**. The DX Components are a reference implementation that
use the [Material UI](https://v4.mui.com/) design system.

* [**react-sdk-overrides**](https://www.npmjs.com/package/@pega/react-sdk-overrides) <br />
This package contains the source (uncompiled) code for the **DX Components**. This code
is used as the starting point for any components that a React SDK user chooses to override.
Refer to the [Constellation SDKs Documentation](https://docs.pega.com/bundle/constellation-sdk/page/constellation-sdks/sdks/constellation-sdks.html)
for more information about overriding components.

<br />

<hr />

#### **About react-sdk-components versioning: SDK-R-C x.y.z**

* **SDK-R-C** indicates that this is a release of React SDK Components
* **x.y** indicates the major and min versions of the highest level of Pega Infinity&trade;
that this version of the packages support. For example, SDK-R-C 8.23.* indicates support for
Infinity 8.23. However, the 8.23.* packages also support Pega Infinity 8.8.*
* **z** indicates the patch number for a given release. For example, 8.23.11 is a newer
patch release than 8.23.10. Users should always uses the most recent patch release for a
given major.minor release.
<hr />

#### **Pega Constellation SDKs available**
* **Angular SDK**:
  * Marketplace: https://community.pega.com/marketplace/components/angular-sdk
  * Github: https://github.com/pegasystems/angular-sdk

<br />

* **React SDK**:
  * Marketplace: https://community.pega.com/marketplace/components/react-sdk
  * Github: https://github.com/pegasystems/react-sdk

<br />

* **Web Components SDK**:
  * Marketplace: https://community.pega.com/marketplace/components/web-components-sdk
  * Github: https://github.com/pegasystems/web-components-sdk
