import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import axios from "axios";
import cheerio from 'cheerio';

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);
const showMoviesButton = Markup.button.callback('Че там по фильмам сегодня', 'show_movies');

bot.command('start', async (ctx) => {
  await ctx.reply('Добро пожаловать!', Markup.keyboard([showMoviesButton]).resize());
});

bot.hears('Че там по фильмам сегодня', async (ctx) => {
  try {
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];

    const response = await axios.get(`https://kinoteatr.ru/kinoafisha/kaliningrad/?date=${formattedDate}&when=now&genre[]=horror&genre[]=triller&genre[]=uzhasy&genre[]=horror-slesher&genre[]=mistika`);
    const $ = cheerio.load(response.data);

    const movies = [];

    $('.movie_card_clickable').each((i, el) => {
      const poster = $(el).find('.movie_card_image').attr('content');
      const name = $(el).find('a.movie_card_clickable_zone').attr('data-gtm-ec-name');
      const link = $(el).find('a.movie_card_clickable_zone').attr('href');
      const description = $(el).find('meta[itemprop="description"]').attr('content');
      movies.push({
        poster,
        name,
        link,
        description
      });
    });

    for (const movie of movies) {
      const movieResponse = await axios.get(movie.link);
      const movieDetails = cheerio.load(movieResponse.data);

      const times = [];
      movieDetails('.time').each((i, el) => {
        times.push($(el).text().trim());
      });

      const time = times.join(', ');

      await ctx.replyWithPhoto(movie.poster, {
        caption: `*${movie.name}*\n\n${movie.description}\n\nВремя сеансов: *${time}*`,
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'Купить билет', url: movie.link }
            ]
          ]
        },
        parse_mode: 'Markdown'
      });
    }
  } catch (error) {
    console.error(error);
    ctx.reply('Произошла ошибка. Попробуйте позже.');
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
