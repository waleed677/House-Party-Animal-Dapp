import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connect } from "../../redux/blockchain/blockchainActions";
import { connectWallet } from "../../redux/blockchain/blockchainActions";
import { fetchData } from "./../../redux/data/dataActions";
import { StyledRoundButton } from "./../../components/styles/styledRoundButton.styled";
import * as s from "./../../styles/globalStyles";
import Navbar from "../../components/Navbar/Navbar";
import Countdown from "../../components/Countdown/Countdown";
import axios from 'axios';

const { createAlchemyWeb3, ethers } = require("@alch/alchemy-web3");

var Web3 = require('web3');
var Contract = require('web3-eth-contract');

function Home() {
  let cost = 0;
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const [claimingNft, setClaimingNft] = useState(false);
  const [mintDone, setMintDone] = useState(false);
  const [supply, setTotalSupply] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [mintAmount, setMintAmount] = useState(1);
  const [displayCost, setDisplayCost] = useState(cost);
  const [state, setState] = useState(0);
  const [disable, setDisable] = useState(false);
  const [canMint, setCanMint] = useState(-1);
  const [pushArr, setPushArr] = useState([]);
  let proof = [];
  const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: "",
    SCAN_LINK: "",
    NETWORK: {
      NAME: "",
      SYMBOL: "",
      ID: 0,
    },
    NFT_NAME: "",
    SYMBOL: "",
    MAX_SUPPLY: 1,
    WEI_COST: 0,
    DISPLAY_COST: 0,
    GAS_LIMIT: 0,
    MARKETPLACE: "",
    MARKETPLACE_LINK: "",
    SHOW_BACKGROUND: false,
  });

  const claimNFTs = () => {
    let cost = displayCost;
    cost = Web3.utils.toWei(cost);
    console.log(cost);

    let gasLimit = CONFIG.GAS_LIMIT;
    let totalCostWei = String(cost * mintAmount);
    let totalGasLimit = String(gasLimit * mintAmount);
    setFeedback(`Minting your ${CONFIG.NFT_NAME}`);
    setClaimingNft(true);
    setDisable(true);
    blockchain.smartContract.methods
      .mint(mintAmount,pushArr)
      .send({
        gasLimit: String(totalGasLimit),
        to: CONFIG.CONTRACT_ADDRESS,
        from: blockchain.account,
        value: totalCostWei,
      })
      .once("error", (err) => {
        console.log(err);
        setFeedback("Sorry, something went wrong please try again later.");
        setClaimingNft(false);
      })
      .then((receipt) => {
        setMintDone(true);
        setFeedback(`Congratulations! You have successfully Minted a HPA NFT!`);
        setClaimingNft(false);
        blockchain.smartContract.methods
          .totalSupply()
          .call()
          .then((res) => {
            setTotalSupply(res);
          });

        dispatch(fetchData(blockchain.account));
      });
  };


  const getDataWithoutWallet = async () => {
    const web3 = createAlchemyWeb3("https://eth-rinkeby.alchemyapi.io/v2/EDLW4rQqMI3LEJUWifxT04jTycowEQNU");
    const abiResponse = await fetch("/config/abi.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const abi = await abiResponse.json();
    var contract = new Contract(abi, '0x044872de2ccd83bb61412995a1523b318ca2dd6d');
    console.log({ contract });
    contract.setProvider(web3.currentProvider);
    let state = await contract.methods.currentState().call();
    setState(state);
    if (state == 1) {
      let wlCost = await contract.methods.costWL().call();
      setDisplayCost(Web3.utils.fromWei(wlCost));
    } else if (state == 2) {
      let cost = await contract.methods.cost().call();
      setDisplayCost(Web3.utils.fromWei(cost));
    } else {
      setDisplayCost(0);
    }
    const totalSupply = await contract.methods
      .totalSupply()
      .call();
    setTotalSupply(totalSupply);
  }

  const getData = async () => {
    if (blockchain.account !== "" && blockchain.smartContract !== null) {
      dispatch(fetchData(blockchain.account));
      console.log(blockchain.account);
      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
       " Access-Control-Allow-Origin": "*",
      };

      await axios.get(`https://whitelist-house-party-animals.herokuapp.com/verify?address=${blockchain.account}`)
        .then(res => {
          if (!res.data.verified) {
            setCanMint(0);
          } else {
            let result = res.data.proof;
            console.log(result);
            proof = result;
            setPushArr(proof);
            setCanMint(1);
            console.log({ pushArr });
            console.log({ canMint });
          }
        });

    }
  };

  const getConfig = async () => {
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const config = await configResponse.json();
    SET_CONFIG(config);
  };

  useEffect(() => {
    getConfig();
    getDataWithoutWallet();
  }, []);

  useEffect(() => {
    getData();
  }, [blockchain.account]);

  const maxNfts = () => {
    setMintAmount(CONFIG.MAX_LIMIT);
    setDisplayCost(parseFloat(displayCost * 2).toFixed(3));
  };

  const decrementMintAmount = () => {
    let newMintAmount = mintAmount - 1;
    if (newMintAmount < 1) {
      newMintAmount = 1;
    }
    setMintAmount(newMintAmount);
    setDisplayCost(parseFloat(CONFIG.DISPLAY_COST_WL * newMintAmount).toFixed(3));
  };

  const incrementMintAmount = () => {
    let newMintAmount = mintAmount + 1;
    if (newMintAmount > 2) {
      newMintAmount = 2;
    }
    setMintAmount(newMintAmount);
    setDisplayCost(parseFloat(CONFIG.DISPLAY_COST_WL * newMintAmount).toFixed(3));
  };

  return (
    <>

      <s.Body>
        <s.FlexContainer
          jc={"space-evenly"}
          ai={"center"}
          fd={"row"}
          mt={"20vh"}
        >
          <s.Mint>
            <s.TextTitle size={2.5}>
              {CONFIG.NFT_NAME}
            </s.TextTitle>
            <s.TextSubTitle size={1.4}>{CONFIG.MAX_SUPPLY - supply} of {CONFIG.MAX_SUPPLY} NFT's Available</s.TextSubTitle>
            <s.SpacerSmall />
            <s.SpacerLarge />

            <s.FlexContainer fd={"row"} ai={"center"} jc={"space-between"}>

              <s.AmountContainer ai={"center"} jc={"center"} fd={"row"}>
                <StyledRoundButton
                  style={{ border: "1px solid #fff", borderRadius: "50%", padding: "15px" }}
                  disabled={claimingNft ? 1 : 0}
                  onClick={(e) => {
                    e.preventDefault();
                    decrementMintAmount();
                  }}
                >
                  -
                </StyledRoundButton>
                <s.SpacerMedium />
                <s.TextDescription color={"var(--primary-text)"} size={"2.5rem"}>
                  {mintAmount}
                </s.TextDescription>
                <s.SpacerMedium />
                <StyledRoundButton
                  disabled={claimingNft ? 1 : 0}
                  style={{ border: "1px solid #fff", borderRadius: "50%", padding: "15px" }}
                  onClick={(e) => {
                    e.preventDefault();
                    incrementMintAmount();
                  }}
                >
                  +
                </StyledRoundButton>
              </s.AmountContainer>
              <s.maxButton
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.preventDefault();
                  maxNfts();
                }}
              >
                Max
              </s.maxButton>
            </s.FlexContainer>
            <s.Line />
            <s.SpacerLarge />
            <s.FlexContainer fd={"row"} ai={"center"} jc={"space-between"}>
              <s.TextTitle>Total</s.TextTitle>
              <s.TextTitle color={"#dbac36"}>{displayCost}</s.TextTitle>
            </s.FlexContainer>
            <s.SpacerSmall />
            <s.Line />
            <s.SpacerSmall />
            <s.SpacerLarge />

            {blockchain.account !== "" && blockchain.smartContract !== null && blockchain.errorMsg === ""
              && canMint === 1
              ? (
                <s.Container ai={"center"} jc={"center"} fd={"column"}>
                  <s.connectButton
                    disabled={disable}
                    style={{
                      textAlign: "center",
                      color: "#fff",
                      cursor: "pointer",
                      fontWeight: "bolder"
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      claimNFTs();
                      getData();
                    }}
                  >
                    {" "}
                    {claimingNft ? "Confirm Transaction in Wallet" : "MINT NOW"}{" "}


                  </s.connectButton>{" "}
                  <s.SpacerLarge></s.SpacerLarge>
                  <s.TextTitle size={"1.5"}>
                    {mintDone ? feedback : ""}{" "}

                  </s.TextTitle>
                </s.Container>
              ) : (
                <>
                  <s.connectButton
                    style={{
                      textAlign: "center",
                      color: "#fff",
                      cursor: "pointer",
                      fontWeight: "bolder"
                    }}

                    onClick={(e) => {
                      e.preventDefault();
                      dispatch(connectWallet());
                      getData();
                    }}
                  >
                    {canMint === -1 ? "Connect Your Wallet" : "Sorry, you are not authorised to mint"}
                  </s.connectButton>
                  {/* ) : ("")} */}
                </>

              )}
            <s.SpacerLarge />
            {blockchain.errorMsg !== "" ? (
              <s.connectButton
                style={{
                  textAlign: "center",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {blockchain.errorMsg}
              </s.connectButton>
            ) : (
              ""

            )}
          </s.Mint>
        </s.FlexContainer>
        <s.SpacerLarge />
      </s.Body>

    </>
  );
}

export default Home;
