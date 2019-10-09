# Looker Custom Visualization Builder

This project is a browser-based IDE for developing Looker custom visualizations. It is currently hosted at https://lookervisbuilder.com

## Getting Started

#### Requirements

 - node (I am using version 8.12.0)
 - ruby 2.3.3 or above

#### Building the Project

To build this project locally, everything you need to do is contained in the following script:

```
npm run build
```

If you have not worked with ruby before, you may encounter this error:

```
Gem::GemNotFoundException: can't find gem bundler (>= 0.a) with executable bundle
```

If that happens, you will simply have to install the bundler gem and everything should build properly

```
gem install bundler
```

Finally, to run the server...

```
ruby app.rb -s Puma 
```

## Known Issues + Things to Come

 - [ ] Ability to resize editor panels
 - [ ] A dropdown select to switch between example visualization
 - [ ] A dropdown select to switch between various example data sets
 - [ ] **BIG ISSUE** - Not properly reading the config options
