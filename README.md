# Prep exercise week 4

As a preparation step for the upcoming Q&A, you need to work on the following exercise, which is based on the prep
exercise of the previous week.

## Exercise

Last week you updated your database to be normalized. Now that you have some more NoSQL knowledge, convert your database
to a document-based database. Think about the following:

- What are the collections?
- What information will you embed in a document and which will you store normalised?

## Discussion (Try to write answers to these questions in text, provide queries and commands when necessary)

- What made you decide when to embed information? What assumptions did you make?

Answer: I decided to embed information when I needed to store information about a recipe because it is usually like recipes provided in all recourses. Except categories, which could be different on different resources. Also the recipe data structure won't change frequently and that recipes won't have an excessive number of ingredients or steps.

- If you were given MySQL and MongoDB as choices to build the recipe's database at the beginning, which one would you
  choose and why?

Answer: I would choose MongoDB because it can accelerate development because it allows developers to work with recipes in a way people usually use it, reducing the need for complex data transformations. 