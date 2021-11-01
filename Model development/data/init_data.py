import tables


atom = tables.Float64Atom()
with tables.open_file("training_data.h5", mode="w") as f:
    f.create_earray(f.root, "state", atom, (0, 6, 6, 51))
    f.create_earray(f.root, "policy", atom, (0, 6, 6, 54))
    f.create_earray(f.root, "value", atom, (0, 1))
