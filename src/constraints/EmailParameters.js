const constraints = {
  host: {
    presence: true,
  },
  port: {
    presence: true,
    format: /[0-9]+/,
  },
  username: {
    presence: true,
  },
  password: {
    presence: true,
  },
};

export default constraints;
