export default function Footer() {
  return (
    <footer className="border-t border-line px-5 py-10 font-mono text-xs text-lab md:px-14">
      <div className="flex flex-wrap justify-between gap-4">
        <span>© 2026 Nikhil Chary Sriramoju · MIT licensed</span>
        <span className="flex gap-5">
          <a className="hover:text-brand" href="https://github.com/Nikhil-creat" target="_blank" rel="noopener">GitHub</a>
          <a className="hover:text-brand" href="https://in.linkedin.com/in/nikhil-chary-sriramoju-95041b38a" target="_blank" rel="noopener">LinkedIn</a>
          <a className="hover:text-brand" href="mailto:sriramojunikhil66@gmail.com">Email</a>
        </span>
      </div>
    </footer>
  );
}
