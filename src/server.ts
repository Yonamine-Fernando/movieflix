import express from "express";
import { PrismaClient } from "@prisma/client";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

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
  } catch (error) {
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
  } catch (error) {
    return res
      .status(500)
      .send({ message: "falha ao atualizar o registro do filme!" });
  }
  res.status(200).send({ message: "filme atualizado com sucesso" });
});

app.delete("/movies/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const movie = await prisma.movie.findUnique({ where: { id } })
  
    if (!movie) {
      return res.status(404).send({ message: 'o filme não foi encontrado' })
    }

    await prisma.movie.delete({ where: { id } });
  } catch (error) {
    return res.status(500).send({message: "Não foi possivel remover o registro "})
  }
  res.status(200).send({ message: "registro removido com sucesso" });
});

app.listen(port, () => {
  console.log(`servidor executando no http://localhost:${port}`);
});
