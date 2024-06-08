const countUpperCase = (string: string) => {
  return (string.match(/[A-Z]/g) || []).length
}

export { countUpperCase }