const comprobarIdMongo = (req, res, next) => {
  const { id } = req.params;
  const _id = id.trim();
  if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(401).json({ msg: "Id no valido" });
  }
  next();
};

export default comprobarIdMongo;
