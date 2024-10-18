function ShopIcon({ className = "" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width={24}
            height={24}
            fill={"none"}
            className={`${className}`}
        >
            <path
                d="M3.00003 10.9866V15.4932C3.00003 18.3257 3.00003 19.742 3.87871 20.622C4.75739 21.502 6.1716 21.502 9.00003 21.502H15C17.8284 21.502 19.2426 21.502 20.1213 20.622C21 19.742 21 18.3257 21 15.4932V10.9866"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path
                d="M7.00003 17.9741H11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M17.7957 2.50049L6.14986 2.52954C4.41169 2.44011 3.96603 3.77859 3.96603 4.4329C3.96603 5.01809 3.89058 5.8712 2.82527 7.47462C1.75996 9.07804 1.84001 9.55437 2.44074 10.6644C2.93931 11.5857 4.20744 11.9455 4.86865 12.0061C6.96886 12.0538 7.99068 10.2398 7.99068 8.96495C9.03254 12.1683 11.9956 12.1683 13.3158 11.802C14.6386 11.435 15.7717 10.1214 16.0391 8.96495C16.195 10.4021 16.6682 11.2408 18.0663 11.817C19.5145 12.4139 20.7599 11.5016 21.3848 10.9168C22.0097 10.332 22.4107 9.03364 21.2968 7.60666C20.5286 6.62257 20.2084 5.69548 20.1033 4.73462C20.0423 4.17787 19.9888 3.57961 19.5972 3.1989C19.0248 2.64253 18.2036 2.47372 17.7957 2.50049Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default ShopIcon;
