export default function Page() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-2">
            <div className="flex flex-col bg-white p-8 rounded-lg shadow-md w-80">
                <h1 className="font-bold text-2xl mb-4">Login Page</h1>
                <p className="mb-4">
                    Please enter your mnemonic phrase to login:
                </p>
                <form className="flex flex-col space-y-4">
                    <label className="flex flex-col space-y-2">
                        <span className="text-sm font-medium">
                            Mnemonic Phrase:
                        </span>
                        <input
                            type="text"
                            name="mnemonic"
                            className="p-2 border rounded-md"
                        />
                    </label>
                    <input
                        type="submit"
                        value="Submit"
                        className="p-2 bg-blue-500 text-white rounded-md cursor-pointer"
                    />
                </form>
            </div>
        </div>
    );
}
