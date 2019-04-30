const debug = process.env.DEBUG === 'true';

const Log = {
  debug: (msg, ...args) => {
    if (debug) {
      /* eslint-disable-next-line no-console */
      console.log(`[D] ${msg}`, ...args);
    }
  },
};

export default Log;
