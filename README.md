<p align="center"><img width=60% src="docs/media/ReactSDK-Logo.png">

# React SDK Components

The **React SDK Components** repo is used to create the [**@pega/react-sdk-components**](https://www.npmjs.com/package/@pega/react-sdk-components)
and [**@pega/react-sdk-overrides**](https://www.npmjs.com/package/@pega/react-sdk-overrides) npm packages
used by the Pega [**Constellation React SDK**](https://community.pega.com/marketplace/component/react-sdk).
These packages provide the initial set of components used by the **React SDK** to render DX Components with
a design system other than Pega Constellation design system.

This repository is provided to allow **React SDK** users easier access to the source code for
the DX Components that are in the npm packages mentioned above. As a public repo, we expect
that most users will use it as a reference to review and learn from the code that's in the
npm packages.

To create a project to use the Constellation React SDK, please use the **React SDK**. You can get started
with the React SDK using the information (including pointers to online documentation) at
[**Pega Community**](https://community.pega.com/marketplace/component/react-sdk) and the React SDK code
on [**GitHub**](https://community.pega.com/marketplace/component/react-sdk).

## Packages in this repo

* [**react-sdk-components**](https://www.npmjs.com/package/@pega/react-sdk-components) <br />
This package contains the source code for the Pega-provided **bridge** (in src/bridge)
from the [**ConstellationJS Engine**](https://www.npmjs.com/package/@pega/constellationjs) to
the **DX components** (in src/components). The DX Components are a reference implementation that
use the [Material UI](https://v4.mui.com/) design system. The bridge and components are
published in the [**@pega/react-sdk-components**](https://www.npmjs.com/package/@pega/react-sdk-components)
npm module.

* [**react-sdk-overrides**](https://www.npmjs.com/package/@pega/react-sdk-overrides) <br />
Scripts in this repo process the components in the **react-sdk-components** package to provide
an initial implementation for SDK users who want to **override** the React SDK's Pega-provided
implementation. The source code for these override components is published in the
[**@pega/react-sdk-overrides**](https://www.npmjs.com/package/@pega/react-sdk-overrides) npm module.


<hr />

## License

This project is licensed under the terms of the **Apache 2** license.

You can see the full license [here](LICENSE) or directly on [apache.org](https://www.apache.org/licenses/LICENSE-2.0).


<hr />

## Contributing

We welcome contributions to the React SDK Components project.

Refer to our [guidelines for contributors](./docs/CONTRIBUTING.md) if you are interested in contributing to the project.

<hr />

## Additional Resources

* [Constellaton React SDK on Pega Community](https://community.pega.com/marketplace/component/react-sdk)
* [Constellation React SDK code](https://github.com/pegasystems/react-sdk)
* [Constellation SDKs Documentation](https://docs.pega.com/bundle/constellation-sdk/page/constellation-sdks/sdks/constellation-sdks.html)
* [Troubleshooting Constellation SDKs](https://docs.pega.com/bundle/constellation-sdk/page/constellation-sdks/sdks/troubleshooting-constellation-sdks.html)
* [MediaCo sample application](https://docs.pega.com/bundle/constellation-sdk/page/constellation-sdks/sdks/mediaco-sample-application.html)
* [Material UI](https://v4.mui.com/)
