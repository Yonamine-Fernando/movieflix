import express from "express";
import { PrismaClient } from "@prisma/client";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger.json";
const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/movies", async (_, res) => {
  const movies = await prisma.movie.findMany({
    orderBy: { title: "asc" },
    include: { genres: true, languages: true },
  });
  res.json(movies);
});

app.post("/movies", async (req, res) => {
  const { title, genre_id, language_id, oscar_count, release_date } = req.body;

  try {
    const movieWithSameTitle = await prisma.movie.findFirst({
      where: {
        title: { equals: title, mode: "insensitive" },
      },
    });

    if (movieWithSameTitle) {
      return res.status(409).send({
        message: "Já existe um filme com esse título/ filme cadastrado",
      });
    }

    await prisma.movie.create({
      data: {
        title,
        genre_id,
        language_id,
        oscar_count,
        release_date: new Date(release_date),
      },
    });
  } catch {
    return res.status(500).send({ message: "fala ao cadastrar filme" });
  }
  res.status(201).send();
});

app.put("/movies/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const movie = await prisma.movie.findUnique({
      where: {
        id,
      },
    });

    if (!movie) {
      return res.status(404).send({ message: "registro não encontrado" });
    }

    const data = { ...req.body };
    data.release_date = data.release_date
      ? new Date(data.release_date)
      : undefined;

    await prisma.movie.update({
      where: {
        id,
      },
      data: data,
    });
  } catch {
    return res
      .status(500)
      .send({ message: "falha ao atualizar o registro do filme!" });
  }
  res.status(200).send({ message: "filme atualizado com sucesso" });
});

app.delete("/movies/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const movie = await prisma.movie.findUnique({ where: { id } });

    if (!movie) {
      return res.status(404).send({ message: "O filme não foi encontrado" });
    }

    await prisma.movie.delete({ where: { id } });
  } catch {
    return res
      .status(500)
      .send({ message: "Não foi possivel remover o registro " });
  }
  res.status(200).send({ message: "registro removido com sucesso" });
});

app.get("/movies/:genreName", async (req, res) => {
  console.log(req.params.genreName);
  try {
    const moviesFilteredByGenreName = await prisma.movie.findMany({
      include: {
        genres: true,
        languages: true,
      },
      where: {
        genres: {
          name: {
            equals: req.params.genreName,
            mode: "insensitive",
          },
        },
      },
    });
    res.status(200).send(moviesFilteredByGenreName);
  } catch {
    return res.status(500).send({ message: "Erro a Filtrar filme" });
  }
});

app.get("/genres", async (_, res) => {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: {
        name: "asc",
      },
    });

    res.json(genres);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Houve um problema ao buscar os gêneros." });
  }
});

app.post("/genres", async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).send({ message: "O nome do gênero é obrigatório." });
  }

  try {
    
    const existingGenre = await prisma.genre.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });

    if (existingGenre) {
      return res.status(409).send({ message: "Esse gênero já existe." });
    }

    const newGenre = await prisma.genre.create({
      data: {
        name,
      },
    });

    res.status(201).json(newGenre);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Houve um problema ao adicionar o novo gênero." });
  }
});

app.put("/genres/:id", async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).send({ message: "O nome do gênero é obrigatório." });
  }

  try {
    const genre = await prisma.genre.findUnique({
      where: { id: Number(id) },
    });

    if (!genre) {
      return res.status(404).send({ message: "Gênero não encontrado." });
    }

    const existingGenre = await prisma.genre.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        id: { not: Number(id) },
      },
    });

    if (existingGenre) {
      return res
        .status(409)
        .send({ message: "Este nome de gênero já existe." });
    }

    const updatedGenre = await prisma.genre.update({
      where: { id: Number(id) },
      data: { name },
    });

    res.status(200).json(updatedGenre);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Houve um problema ao atualizar o gênero." });
  }
});

app.listen(port, () => {
  console.log(`servidor executando no http://localhost:${port}`);
});
