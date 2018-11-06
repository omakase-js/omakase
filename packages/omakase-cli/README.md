@artsy/omakase

WIP right now. Rough idea:

- There is an omakase cli tool for template files like a new QueryRenderer etc
- There is a react-scripts fork
- The "omakase" is a collection of small modules which combine webpack-y stuff ( see [zeit/next-plugins/](https://github.com/zeit/next-plugins/tree/master/packages) )
- There is a preset which is basically making sure [this list](https://speakerdeck.com/artsyopensource/the-artsy-omakase-artsy-x-react-native-2018?slide=25) is set up


## How do I work on this?

```sh
git clone https://github.com/artsy/omakase.git
cd omakase

yarn install
code .

# Run tests to prove it all works
yarn test
```
