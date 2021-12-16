function Home() {
  return (
    <div className="container">
      {/* style tag must have a "jsx" attribute and an optional "global" attribute */}
      <style global jsx>{`
        .container {
          margin: 50px;
        }
        p {
          color: blue;
        }
      `}</style>
      <style jsx>{`
        .container {
          margin: 50px;
        }
        p {
          color: blue;
        }
      `}</style>
      <style jsx global>{`
        .container {
          margin: 50px;
        }
        p {
          color: blue;
        }
      `}</style>
      <style global>{`
        .container {
          margin: 50px;
        }
        p {
          color: blue;
        }
      `}</style>
      <style>{`
        .container {
          margin: 50px;
        }
        p {
          color: blue;
        }
      `}</style>
    </div>
  );
}
