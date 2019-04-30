import FBXLoaderStandard from './libs/FBXLoader';

const promisifyLoader = (loader, onProgress) => {
  const promiseLoader = url => new Promise((resolve, reject) => {
    loader.load(url, resolve, onProgress, reject);
  });
  return {
    originalLoader: loader,
    load: promiseLoader,
  };
};

export const FBXLoader = () => (
  promisifyLoader(new FBXLoaderStandard())
);
