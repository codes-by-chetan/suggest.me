import { readFile, writeFile } from 'fs/promises';
   import pkg from 'lodash';
   const { uniq } = pkg;

   // Function to extract structured movie details using rules and regex
   async function extractMovieDetails(inputFile = 'output.json', outputFile = 'structured_movie_data.json') {
       try {
           console.log('Bhai, rule-based extraction shuru kar raha hu...');

           // Load scraped data
           const rawData = await readFile(inputFile, 'utf-8');
           const scrapedData = JSON.parse(rawData);

           // Combine paragraphs into context
           let context = '';
           for (const result of scrapedData.results) {
               if (result.paragraphs) {
                   context += result.paragraphs.filter(p => p).join(' ') + ' ';
               }
           }
           context = context.trim();
           if (!context) {
               throw new Error('Abe, koi context nahi mila!');
           }

           // Define extraction rules
           const rules = {
               title: /Inception/gi,
               director: /(?:directed by|director:)\s*([\w\s]+)/i,
               cast: /(?:starring|cast:)\s*([\w\s,]+)/i,
               genres: /(?:genres?|genre:)\s*([\w\s,]+)/i,
               release_year: /(?:released?|release year:)\s*(\d{4})/i,
               runtime: /(?:runtime|duration:)\s*(\d+h\s*\d+m?)/i,
               plot_summary: /(?:plot|story:)\s*([^.]+?\.)/i,
               budget: /(?:budget:)\s*(\$?\d+\s*million)/i,
               box_office: /(?:box office:)\s*(\$?\d+\s*million)/i,
               awards: /(?:won|awards:)\s*([\w\s,]+)/i
           };

           // Extract data
           const extractedData = { movie: {} };
           for (const [field, regex] of Object.entries(rules)) {
               try {
                   const match = context.match(regex);
                   let answer = match ? match[1] || match[0] : null;

                   // Post-process answers
                   if (field === 'cast') {
                       extractedData.movie[field] = answer ? uniq(answer.split(',').map(actor => actor.trim()).filter(Boolean)) : [];
                   } else if (field === 'genres') {
                       const validGenres = ['Sci-Fi', 'Thriller', 'Action', 'Drama', 'Adventure'];
                       extractedData.movie[field] = answer ? uniq(answer.split(',').map(g => g.trim()).filter(g => validGenres.includes(g))) : [];
                   } else if (field === 'release_year') {
                       extractedData.movie[field] = answer ? Number(answer) : null;
                   } else if (field === 'runtime') {
                       if (answer && answer.includes('h')) {
                           const [hours, minutes] = answer.split('h').map(part => parseInt(part));
                           extractedData.movie[field] = hours * 60 + (minutes || 0);
                       } else {
                           extractedData.movie[field] = answer;
                       }
                   } else if (field === 'awards') {
                       extractedData.movie[field] = answer ? answer.split(',').map(award => award.trim()).filter(Boolean) : [];
                   } else {
                       extractedData.movie[field] = answer;
                   }
               } catch (err) {
                   console.warn(`Error extracting ${field}: ${err.message}`);
                   extractedData.movie[field] = null;
               }
           }

           // Hard-coded ratings
           extractedData.movie.ratings = {
               imdb: 8.8,
               rotten_tomatoes: 87,
               metacritic: 74
           };

           // Save output
           await writeFile(outputFile, JSON.stringify(extractedData, null, 2));
           console.log(`Structured data ${outputFile} mein save ho gaya, bhai!`);

           return extractedData;
       } catch (error) {
           console.error('Kuch toh gadbad hai, bhai:', error.message);
           const errorData = { error: error.message };
           await writeFile(outputFile, JSON.stringify(errorData, null, 2));
           return errorData;
       }
   }

   // Export for use
   export { extractMovieDetails };

   // Run if executed directly
   if (import.meta.url === new URL(import.meta.url).href) {
       await extractMovieDetails();
   }