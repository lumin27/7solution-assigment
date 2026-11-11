import { TodoBoard } from "@/features/todo/components/TodoBoard";

export default function HomePage() {
  return (
    <main className='mx-auto max-w-5xl p-3 sm:p-6'>
      <h1 className='text-2xl font-bold text-center mb-6'>
        Auto Delete Todo List
      </h1>
      <TodoBoard />
    </main>
  );
}
