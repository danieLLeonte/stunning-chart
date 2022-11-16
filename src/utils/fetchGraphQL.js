import axios from "axios";

let array = [];

const endpoint = 'https://fakerql.goosfraba.ro/graphql';

const graphqlQuery = `query allPosts {
  allPosts(count: 100) {
    id
    createdAt
  }
}`;

const options = {
  query: graphqlQuery
}

export const fetchFromAPI = async () => {
  const { data } = await axios.post(endpoint, options);

  let posts = {}
  let postsDate = {}

  data.data.allPosts.forEach((element, idx) => {
    let dateStr = new Date(element.createdAt / 1).toDateString();
    let dateStrArr = dateStr.split(' ');

    if (dateStrArr[3] === "2019") {
      // we create key/value pairs of type - key(month): value:=(number of posts)
      if(!posts[dateStrArr[1]]) {
        posts[dateStrArr[1]] = 0;

        // we also save the data separately in iso format to use it in the graph
        postsDate[idx] = new Date(element.createdAt / 1).toISOString();
      }

      posts[dateStrArr[1]] += 1;
    }
  });

  // we add each key/value pair to the array and save them as a new object
  for (const [key, value] of Object.entries(posts)) {
    array.push({date: key, posts: value})
  }

  // to each object in the array with ["date"] key we assign the date in iso format
  array.map((element, idx) => element["date"] = Object.entries(postsDate)[idx][1])
  
  array = array.sort((a,b) => Date.parse(a.date) - Date.parse(b.date));

  return array;
}